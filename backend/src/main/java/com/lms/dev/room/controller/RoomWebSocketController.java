package com.lms.dev.room.controller;

import com.lms.dev.entity.User;
import com.lms.dev.repository.UserRepository;
import com.lms.dev.room.dto.RoomChatRequest;
import com.lms.dev.room.dto.RoomHintRequest;
import com.lms.dev.room.dto.RoomJoinRequest;
import com.lms.dev.room.dto.RoomWhiteboardEvent;
import com.lms.dev.room.service.RoomService;
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
public class RoomWebSocketController {

    private final RoomService roomService;
    private final UserRepository userRepository;

    @MessageMapping("/rooms/join")
    public void join(RoomJoinRequest request, Principal principal) {
        roomService.joinRoom(resolveUserId(principal), request);
    }

    @MessageMapping("/rooms/{roomId}/chat")
    public void chat(
            @DestinationVariable UUID roomId,
            RoomChatRequest request,
            Principal principal
    ) {
        roomService.sendChatMessage(roomId, resolveUserId(principal), request);
    }

    @MessageMapping("/rooms/{roomId}/whiteboard")
    public void whiteboard(
            @DestinationVariable UUID roomId,
            RoomWhiteboardEvent request,
            Principal principal
    ) {
        roomService.broadcastWhiteboard(roomId, resolveUserId(principal), request);
    }

    @MessageMapping("/rooms/{roomId}/hint")
    public void hint(
            @DestinationVariable UUID roomId,
            RoomHintRequest request,
            Principal principal
    ) {
        roomService.requestHint(roomId, resolveUserId(principal), request);
    }

    @MessageMapping("/rooms/{roomId}/leave")
    public void leave(
            @DestinationVariable UUID roomId,
            Principal principal
    ) {
        roomService.leaveRoom(roomId, resolveUserId(principal));
    }

    private UUID resolveUserId(Principal principal) {
        if (!(principal instanceof Authentication authentication) || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Unauthorized websocket user");
        }

        Object authPrincipal = authentication.getPrincipal();
        if (authPrincipal instanceof com.lms.dev.security.UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }

        String email = null;
        if (authPrincipal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (authPrincipal instanceof String principalName && !"anonymousUser".equalsIgnoreCase(principalName)) {
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

