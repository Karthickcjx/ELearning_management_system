package com.lms.dev.ai.service;

import com.lms.dev.ai.dto.AiFeedbackRequest;
import com.lms.dev.ai.dto.AiMessageResponse;
import com.lms.dev.ai.dto.AiRecommendationResponse;
import com.lms.dev.ai.dto.AiSessionResponse;
import com.lms.dev.ai.dto.AiUsageDailyResponse;
import com.lms.dev.ai.dto.CreateAiSessionRequest;
import com.lms.dev.ai.entity.AiFeedback;
import com.lms.dev.ai.entity.AiMessage;
import com.lms.dev.ai.entity.AiSession;
import com.lms.dev.ai.repository.AiFeedbackRepository;
import com.lms.dev.ai.repository.AiMessageRepository;
import com.lms.dev.ai.repository.AiSessionRepository;
import com.lms.dev.course.entity.Course;
import com.lms.dev.user.entity.User;
import com.lms.dev.course.repository.CourseRepository;
import com.lms.dev.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiSessionService {

    private final AiSessionRepository sessionRepository;
    private final AiMessageRepository messageRepository;
    private final AiFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AiRecommendationService recommendationService;
    private final AiUsageService usageService;

    @Transactional
    public AiSessionResponse createSession(UUID userId, CreateAiSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Course course = null;
        if (request != null && request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        }

        AiSession session = AiSession.builder()
                .user(user)
                .course(course)
                .lessonId(request == null ? null : trimToNull(request.getLessonId()))
                .build();

        return toSessionResponse(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public AiSessionResponse getSession(UUID userId, UUID sessionId) {
        return toSessionResponse(mustFindSession(sessionId, userId));
    }

    @Transactional(readOnly = true)
    public List<AiMessageResponse> getMessages(UUID userId, UUID sessionId, int limit) {
        mustFindSession(sessionId, userId);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        List<AiMessage> messages = messageRepository.findRecentBySessionId(sessionId, PageRequest.of(0, safeLimit));
        Collections.reverse(messages);
        return messages.stream().map(this::toMessageResponse).toList();
    }

    @Transactional
    public void submitFeedback(UUID userId, Long messageId, AiFeedbackRequest request) {
        if (request == null || (request.getVote() != 1 && request.getVote() != -1)) {
            throw new IllegalArgumentException("Vote must be 1 or -1");
        }

        AiMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        UUID messageOwnerId = message.getSession().getUser().getId();
        if (!messageOwnerId.equals(userId)) {
            throw new IllegalArgumentException("Cannot submit feedback for another user's message");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        AiFeedback feedback = AiFeedback.builder()
                .message(message)
                .user(user)
                .vote(request.getVote())
                .comment(trimToNull(request.getComment()))
                .build();
        feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<AiRecommendationResponse> getRecommendations(UUID userId, UUID courseId) {
        return recommendationService.getRecommendations(userId, courseId);
    }

    @Transactional(readOnly = true)
    public AiUsageDailyResponse getTodayUsage(UUID userId) {
        return usageService.getTodayUsage(userId);
    }

    private AiSession mustFindSession(UUID sessionId, UUID userId) {
        return sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
    }

    private AiSessionResponse toSessionResponse(AiSession session) {
        return AiSessionResponse.builder()
                .sessionId(session.getId())
                .courseId(session.getCourse() == null ? null : session.getCourse().getCourse_id())
                .lessonId(session.getLessonId())
                .status(session.getStatus())
                .startedAt(session.getStartedAt())
                .lastActivityAt(session.getLastActivityAt())
                .build();
    }

    private AiMessageResponse toMessageResponse(AiMessage message) {
        return AiMessageResponse.builder()
                .id(message.getId())
                .sender(message.getSender())
                .content(message.getContent())
                .tokenCount(message.getTokenCount())
                .latencyMs(message.getLatencyMs())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

