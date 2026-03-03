package com.lms.dev.controller;

import com.lms.dev.dto.chat.ChatRequest;
import com.lms.dev.dto.chat.ChatResponse;
import com.lms.dev.service.CohereService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final CohereService cohereService;

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
            }
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ChatResponse(message));
        }
    }
}
