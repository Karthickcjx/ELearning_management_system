package com.lms.dev.ai.controller;

import com.lms.dev.ai.dto.AiAskRequest;
import com.lms.dev.ai.service.AiRealtimeService;
import com.lms.dev.user.entity.User;
import com.lms.dev.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class AiWebSocketController {

    private final AiRealtimeService aiRealtimeService;
    private final UserRepository userRepository;

    @MessageMapping("/ai/session/{sessionId}/ask")
    public void ask(
            @DestinationVariable UUID sessionId,
            AiAskRequest request,
            Principal principal
    ) {
        if (!(principal instanceof Authentication authentication) || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Unauthorized websocket user");
        }

        UUID userId = resolveUserId(authentication);
        aiRealtimeService.processQuestion(sessionId, userId, request);
    }

    private UUID resolveUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.lms.dev.security.UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }

        String email = null;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalName && !"anonymousUser".equalsIgnoreCase(principalName)) {
            email = principalName;
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Invalid websocket principal");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Invalid websocket principal user");
        }
        return user.getId();
    }
}

