package com.lms.dev.progress.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.lms.dev.progress.dto.ProgressRequest;
import com.lms.dev.progress.dto.ProgressResponse;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.progress.service.ProgressService;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final SecurityAccessService securityAccessService;

    @GetMapping("/{userId}/{courseId}")
    public float getProgress(@PathVariable UUID userId, @PathVariable UUID courseId, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, userId);
        return progressService.getProgress(userId, courseId);
    }

    @GetMapping("/summary/{userId}/{courseId}")
    public ProgressResponse getProgressSummary(@PathVariable UUID userId, @PathVariable UUID courseId, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, userId);
        return progressService.getProgressSummary(userId, courseId);
    }

    @PutMapping("/update-progress")
    public ResponseEntity<String> updateProgress(@RequestBody ProgressRequest request, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, request.getUserId());
        return progressService.updateProgress(request);
    }
    
    @PutMapping("/update-duration")
    public ResponseEntity<String> updateDuration(@RequestBody ProgressRequest request, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, request.getUserId());
        return progressService.updateDuration(request);
    }
}
