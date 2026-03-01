package com.lms.dev.ai.controller;

import com.lms.dev.ai.dto.AiFeedbackRequest;
import com.lms.dev.ai.dto.AiMessageResponse;
import com.lms.dev.ai.dto.AiRecommendationResponse;
import com.lms.dev.ai.dto.AiSessionResponse;
import com.lms.dev.ai.dto.AiUsageDailyResponse;
import com.lms.dev.ai.dto.CreateAiSessionRequest;
import com.lms.dev.ai.service.AiSessionService;
import com.lms.dev.entity.User;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiSessionService aiSessionService;
    private final UserRepository userRepository;

    @PostMapping("/sessions")
    public ResponseEntity<AiSessionResponse> createSession(
            Authentication authentication,
            @RequestBody(required = false) CreateAiSessionRequest request
    ) {
        UUID userId = requireUserId(authentication);
        CreateAiSessionRequest safeRequest = request == null ? new CreateAiSessionRequest() : request;
        return ResponseEntity.status(HttpStatus.CREATED).body(aiSessionService.createSession(userId, safeRequest));
    }

    @GetMapping("/sessions/{sessionId}")
    public AiSessionResponse getSession(
            Authentication authentication,
            @PathVariable UUID sessionId
    ) {
        return aiSessionService.getSession(requireUserId(authentication), sessionId);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public List<AiMessageResponse> getMessages(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return aiSessionService.getMessages(requireUserId(authentication), sessionId, limit);
    }

    @GetMapping("/recommendations")
    public List<AiRecommendationResponse> getRecommendations(
            Authentication authentication,
            @RequestParam(required = false) UUID courseId
    ) {
        return aiSessionService.getRecommendations(requireUserId(authentication), courseId);
    }

    @PostMapping("/messages/{messageId}/feedback")
    public ResponseEntity<Void> submitFeedback(
            Authentication authentication,
            @PathVariable Long messageId,
            @RequestBody AiFeedbackRequest request
    ) {
        aiSessionService.submitFeedback(requireUserId(authentication), messageId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/usage/daily")
    public AiUsageDailyResponse getDailyUsage(Authentication authentication) {
        return aiSessionService.getTodayUsage(requireUserId(authentication));
    }

    private UUID requireUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof com.lms.dev.security.UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }

        String email = null;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalName) {
            if (!"anonymousUser".equalsIgnoreCase(principalName)) {
                email = principalName;
            }
        }

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized principal");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
        return user.getId();
    }
}

