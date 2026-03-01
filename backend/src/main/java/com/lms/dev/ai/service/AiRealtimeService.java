package com.lms.dev.ai.service;

import com.lms.dev.ai.dto.AiAskRequest;
import com.lms.dev.ai.dto.AiStreamEvent;
import com.lms.dev.ai.entity.AiMessage;
import com.lms.dev.ai.entity.AiSession;
import com.lms.dev.ai.enums.AiMessageSender;
import com.lms.dev.ai.port.AiProviderPort;
import com.lms.dev.ai.repository.AiMessageRepository;
import com.lms.dev.ai.repository.AiSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRealtimeService {

    private static final int MAX_QUESTION_LENGTH = 2000;

    private final AiSessionRepository sessionRepository;
    private final AiMessageRepository messageRepository;
    private final AiProviderPort aiProvider;
    private final AiPromptBuilderService promptBuilderService;
    private final AiTokenEstimator tokenEstimator;
    private final AiRateLimiterService rateLimiterService;
    private final AiUsageService usageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Qualifier("aiTaskExecutor")
    private final TaskExecutor aiTaskExecutor;

    @Transactional
    public void processQuestion(UUID sessionId, UUID userId, AiAskRequest request) {
        String question = normalizeQuestion(request == null ? null : request.getQuestion());
        if (question == null) {
            sendError(sessionId, "Question cannot be empty");
            return;
        }

        if (!rateLimiterService.isAllowed(userId)) {
            sendError(sessionId, "Rate limit exceeded. Please try again shortly.");
            return;
        }

        AiSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (request != null && request.getLessonId() != null && !request.getLessonId().isBlank()) {
            session.setLessonId(request.getLessonId().trim());
        }
        session.touch();
        sessionRepository.save(session);

        int inputTokens = tokenEstimator.estimate(question);
        messageRepository.save(AiMessage.builder()
                .session(session)
                .sender(AiMessageSender.USER)
                .content(question)
                .tokenCount(inputTokens)
                .build());
        usageService.incrementRequestAndInput(userId, inputTokens);

        String prompt = promptBuilderService.buildPrompt(
                session,
                question,
                request == null ? null : request.getCourseId(),
                request == null ? null : request.getLessonId()
        );
        aiTaskExecutor.execute(() -> generateAndStream(sessionId, userId, prompt));
    }

    private void generateAndStream(UUID sessionId, UUID userId, String prompt) {
        long start = System.currentTimeMillis();

        try {
            String answer = aiProvider.generateAnswer(prompt);
            if (answer == null || answer.isBlank()) {
                answer = "I could not generate an answer right now. Please try again.";
            }

            for (String chunk : chunkByWords(answer, 12)) {
                messagingTemplate.convertAndSend(streamDestination(sessionId),
                        AiStreamEvent.builder()
                                .event("TOKEN")
                                .content(chunk)
                                .timestamp(LocalDateTime.now())
                                .build());
            }

            int latencyMs = (int) (System.currentTimeMillis() - start);
            int outputTokens = tokenEstimator.estimate(answer);
            AiSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new IllegalArgumentException("Session not found"));

            messageRepository.save(AiMessage.builder()
                    .session(session)
                    .sender(AiMessageSender.ASSISTANT)
                    .content(answer)
                    .tokenCount(outputTokens)
                    .latencyMs(latencyMs)
                    .build());
            usageService.incrementOutput(userId, outputTokens);

            messagingTemplate.convertAndSend(doneDestination(sessionId),
                    AiStreamEvent.builder()
                            .event("DONE")
                            .content("completed")
                            .timestamp(LocalDateTime.now())
                            .build());
        } catch (Exception ex) {
            log.error("AI realtime generation failed for session {}", sessionId, ex);
            sendError(sessionId, "AI service unavailable. Please retry.");
        }
    }

    private List<String> chunkByWords(String content, int wordsPerChunk) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        String[] words = content.split("\\s+");
        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int counter = 0;

        for (String word : words) {
            if (counter > 0) {
                current.append(" ");
            }
            current.append(word);
            counter++;

            if (counter >= wordsPerChunk) {
                chunks.add(current.append(" ").toString());
                current = new StringBuilder();
                counter = 0;
            }
        }

        if (!current.isEmpty()) {
            chunks.add(current.toString());
        }
        return chunks;
    }

    private String normalizeQuestion(String question) {
        if (question == null) {
            return null;
        }
        String normalized = question.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > MAX_QUESTION_LENGTH) {
            return normalized.substring(0, MAX_QUESTION_LENGTH);
        }
        return normalized;
    }

    private String streamDestination(UUID sessionId) {
        return "/topic/ai/session/" + sessionId + "/stream";
    }

    private String doneDestination(UUID sessionId) {
        return "/topic/ai/session/" + sessionId + "/done";
    }

    private void sendError(UUID sessionId, String message) {
        messagingTemplate.convertAndSend(
                "/topic/ai/session/" + sessionId + "/error",
                AiStreamEvent.builder()
                        .event("ERROR")
                        .content(message)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}
