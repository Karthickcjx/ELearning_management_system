package com.lms.dev.room.controller;

import com.lms.dev.user.entity.User;
import com.lms.dev.user.repository.UserRepository;
import com.lms.dev.room.dto.RoomChatEvent;
import com.lms.dev.room.dto.RoomMemberResponse;
import com.lms.dev.room.dto.RoomSessionSummaryResponse;
import com.lms.dev.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final UserRepository userRepository;

    @GetMapping("/history")
    public List<RoomSessionSummaryResponse> history(Authentication authentication) {
        return roomService.getUserRoomHistory(resolveUserId(authentication));
    }

    @GetMapping("/{roomId}/messages")
    public List<RoomChatEvent> messages(
            Authentication authentication,
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "80") int limit
    ) {
        return roomService.getRoomMessages(resolveUserId(authentication), roomId, limit);
    }

    @GetMapping("/{roomId}/members")
    public List<RoomMemberResponse> members(
            Authentication authentication,
            @PathVariable UUID roomId
    ) {
        return roomService.getRoomMembers(resolveUserId(authentication), roomId);
    }

    @PostMapping("/{roomId}/leave")
    public void leave(Authentication authentication, @PathVariable UUID roomId) {
        roomService.leaveRoom(roomId, resolveUserId(authentication));
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

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
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized principal");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "User not found");
        }
        return user.getId();
    }
}

