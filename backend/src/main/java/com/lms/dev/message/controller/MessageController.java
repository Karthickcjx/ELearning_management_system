package com.lms.dev.message.controller;

import com.lms.dev.common.dto.ApiResponse;
import com.lms.dev.announcement.dto.BroadcastMessageRequest;
import com.lms.dev.message.dto.MessageResponse;
import com.lms.dev.message.dto.SendMessageRequest;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SecurityAccessService securityAccessService;

    /**
     * Any authenticated user (admin or student) sends a message.
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @RequestBody SendMessageRequest request,
            Authentication authentication) {
        UUID senderId = securityAccessService.requireCurrentUserId(authentication);
        MessageResponse response = messageService.sendMessage(senderId, request);
        return ResponseEntity.ok(new ApiResponse<>("Message sent successfully", response));
    }

    /**
     * Admin broadcasts a message to all students.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> broadcastMessage(
            @RequestBody BroadcastMessageRequest request,
            Authentication authentication) {
        UUID senderId = securityAccessService.requireCurrentUserId(authentication);
        List<MessageResponse> responses = messageService.broadcastMessage(senderId, request);
        return ResponseEntity.ok(new ApiResponse<>("Broadcast sent to " + responses.size() + " students", responses));
    }

    /**
     * Get inbox messages (MESSAGE type only) for a user.
     */
    @GetMapping("/inbox/{userId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getInbox(
            @PathVariable UUID userId,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, userId);
        List<MessageResponse> messages = messageService.getInboxMessages(userId);
        return ResponseEntity.ok(new ApiResponse<>("Inbox retrieved", messages));
    }

    /**
     * Get conversation thread between two users.
     */
    @GetMapping("/conversation/{user1}/{user2}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversation(
            @PathVariable UUID user1,
            @PathVariable UUID user2,
            Authentication authentication) {
        UUID currentUserId = securityAccessService.requireCurrentUserId(authentication);
        // Must be one of the participants or admin
        if (!currentUserId.equals(user1) && !currentUserId.equals(user2)) {
            securityAccessService.assertSelfOrAdmin(authentication, user1);
        }
        List<MessageResponse> messages = messageService.getConversation(user1, user2);
        return ResponseEntity.ok(new ApiResponse<>("Conversation retrieved", messages));
    }

    /**
     * Get all messages received by a student (all types — for notifications).
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getStudentMessages(
            @PathVariable UUID studentId,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, studentId);
        List<MessageResponse> messages = messageService.getStudentMessages(studentId);
        return ResponseEntity.ok(new ApiResponse<>("Messages retrieved", messages));
    }

    /**
     * Get sent messages for current user.
     */
    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getSentMessages(
            Authentication authentication) {
        UUID senderId = securityAccessService.requireCurrentUserId(authentication);
        List<MessageResponse> messages = messageService.getSentMessages(senderId);
        return ResponseEntity.ok(new ApiResponse<>("Sent messages retrieved", messages));
    }

    /**
     * Mark a message as read.
     */
    @PatchMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<MessageResponse>> markAsRead(
            @PathVariable UUID messageId,
            Authentication authentication) {
        UUID userId = securityAccessService.requireCurrentUserId(authentication);
        MessageResponse response = messageService.markAsRead(messageId, userId);
        return ResponseEntity.ok(new ApiResponse<>("Message marked as read", response));
    }
}
