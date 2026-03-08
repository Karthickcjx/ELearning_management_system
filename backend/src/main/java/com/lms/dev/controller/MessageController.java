package com.lms.dev.controller;

import com.lms.dev.dto.ApiResponse;
import com.lms.dev.dto.BroadcastMessageRequest;
import com.lms.dev.dto.MessageResponse;
import com.lms.dev.dto.SendMessageRequest;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.service.MessageService;
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
     * Admin sends a message to a specific student.
     */
    @PreAuthorize("hasRole('ADMIN')")
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
     * Get all messages for a specific student.
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
     * Get all messages sent by the admin.
     */
    @PreAuthorize("hasRole('ADMIN')")
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
        UUID studentId = securityAccessService.requireCurrentUserId(authentication);
        MessageResponse response = messageService.markAsRead(messageId, studentId);
        return ResponseEntity.ok(new ApiResponse<>("Message marked as read", response));
    }
}
