package com.lms.dev.learning.controller;

import com.lms.dev.course.dto.EnrollRequest;
import com.lms.dev.course.entity.Course;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.learning.service.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;
    private final SecurityAccessService securityAccessService;

    @GetMapping("/{userId}")
    public List<Course> getLearningCourses(@PathVariable UUID userId, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, userId);
        return learningService.getLearningCourses(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<com.lms.dev.learning.dto.LearningResponse> getEnrollments() {
        return learningService.getEnrollments();
    }

    @PostMapping
    public String enrollCourse(@RequestBody EnrollRequest enrollRequest, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, enrollRequest.getUserId());
        return learningService.enrollCourse(enrollRequest);
    }

    @DeleteMapping("/{id}")
    public void unenrollCourse(@PathVariable UUID id, Authentication authentication) {
        if (!securityAccessService.isAdmin(authentication)) {
            UUID currentUserId = securityAccessService.requireCurrentUserId(authentication);
            if (!learningService.isEnrollmentOwnedByUser(id, currentUserId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Access denied for requested enrollment"
                );
            }
        }
        learningService.unenrollCourse(id);
    }
}
