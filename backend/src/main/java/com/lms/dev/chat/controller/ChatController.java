package com.lms.dev.chat.controller;

import com.lms.dev.chat.dto.ChatRequest;
import com.lms.dev.chat.dto.ChatResponse;
import com.lms.dev.chat.dto.ChatStreamRequest;
import com.lms.dev.chat.dto.CohereStreamEvent;
import com.lms.dev.chat.service.CohereService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final CohereService cohereService;
    @Qualifier("aiTaskExecutor")
    private final TaskExecutor aiTaskExecutor;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.debug("Received chat request");
        try {
            String reply = cohereService.getChatResponse(request.getMessage());
            log.debug("Sending chat response");
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception ex) {
            log.warn("AI chat request failed: {}", ex.getMessage());
            String message = "AI service unavailable. Please retry.";
            if (ex.getMessage() != null && ex.getMessage().contains("COHERE_API_KEY is not configured")) {
                message = "AI is not configured on backend. Set COHERE_API_KEY and retry.";
            } else if (ex.getMessage() != null
                    && ex.getMessage().contains("COHERE_API_KEY is invalid or lacks API permission")) {
                message = "AI key is invalid or lacks Cohere API access. Update COHERE_API_KEY and retry.";
            } else if (ex.getMessage() != null && ex.getMessage().contains("COHERE_MODEL is invalid")) {
                message = "AI model is not available for this Cohere key. Update COHERE_MODEL and retry.";
            }
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ChatResponse(message));
        }
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody ChatStreamRequest request) {
        SseEmitter emitter = new SseEmitter(0L);

        aiTaskExecutor.execute(() -> {
            try {
                cohereService.streamChatResponse(request, event -> sendStreamEvent(emitter, event));
                emitter.complete();
            } catch (UncheckedIOException ex) {
                log.debug("AI chat stream closed by client: {}", ex.getMessage());
                emitter.complete();
            } catch (Exception ex) {
                log.warn("AI chat stream request failed: {}", ex.getMessage());
                sendErrorEvent(emitter, toUserErrorMessage(ex));
                emitter.complete();
            }
        });

        return emitter;
    }

    private void sendStreamEvent(SseEmitter emitter, CohereStreamEvent event) {
        try {
            if ("token".equals(event.getType())) {
                emitter.send(SseEmitter.event()
                        .name("token")
                        .data(Map.of("text", event.getText())));
            } else if ("done".equals(event.getType())) {
                emitter.send(SseEmitter.event()
                        .name("done")
                        .data(Map.of(
                                "inputTokens", event.getInputTokens(),
                                "outputTokens", event.getOutputTokens()
                        )));
            }
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private void sendErrorEvent(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(Map.of("message", message)));
        } catch (IOException ex) {
            log.debug("Unable to send AI chat error event: {}", ex.getMessage());
        }
    }

    private String toUserErrorMessage(Exception ex) {
        String message = ex.getMessage();
        if (message != null && message.contains("COHERE_API_KEY is not configured")) {
            return "AI is not configured on backend. Set COHERE_API_KEY and retry.";
        }
        if (message != null && message.contains("COHERE_API_KEY is invalid or lacks API permission")) {
            return "AI key is invalid or lacks Cohere API access. Update COHERE_API_KEY and retry.";
        }
        if (message != null && message.contains("COHERE_MODEL is invalid")) {
            return "AI model is not available for this Cohere key. Update COHERE_MODEL and retry.";
        }
        if (message != null && message.contains("AI provider rejected")) {
            return "AI provider rejected the tutor request. Please retry with a shorter question.";
        }
        if (message != null && message.contains("high demand")) {
            return "AI model is currently experiencing high demand. Please try again shortly.";
        }
        return "AI service unavailable. Please retry.";
    }
}
