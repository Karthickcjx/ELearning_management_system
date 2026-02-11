package com.lms.dev.controller;

import com.lms.dev.dto.chat.ChatRequest;
import com.lms.dev.dto.chat.ChatResponse;
import com.lms.dev.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final GeminiService geminiService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        System.out.println("Received chat request: " + request.getMessage());
        String reply = geminiService.getChatResponse(request.getMessage());
        System.out.println("Sending reply: " + reply);
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
