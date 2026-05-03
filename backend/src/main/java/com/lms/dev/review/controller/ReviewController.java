package com.lms.dev.review.controller;

import com.lms.dev.common.dto.ApiResponse;
import com.lms.dev.review.dto.CourseRatingSummaryResponse;
import com.lms.dev.review.dto.ReviewEligibilityResponse;
import com.lms.dev.review.dto.ReviewRequest;
import com.lms.dev.review.dto.ReviewResponse;
import com.lms.dev.review.service.ReviewService;
import com.lms.dev.security.SecurityAccessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final SecurityAccessService securityAccessService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        UUID userId = securityAccessService.requireCurrentUserId(authentication);
        ReviewResponse created = reviewService.createReview(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Review submitted successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        UUID userId = securityAccessService.requireCurrentUserId(authentication);
        ReviewResponse updated = reviewService.updateReview(id, userId, request);
        return ResponseEntity.ok(new ApiResponse<>("Review updated successfully", updated));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getCourseReviews(
            @PathVariable UUID courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        Page<ReviewResponse> reviews = reviewService.getCourseReviews(courseId, page, size, sort);
        return ResponseEntity.ok(new ApiResponse<>("Course reviews retrieved successfully", reviews));
    }

    @GetMapping("/course/{courseId}/summary")
    public ResponseEntity<ApiResponse<CourseRatingSummaryResponse>> getCourseRatingSummary(@PathVariable UUID courseId) {
        return ResponseEntity.ok(new ApiResponse<>(
                "Course rating summary retrieved successfully",
                reviewService.getCourseRatingSummary(courseId)
        ));
    }

    @GetMapping("/my/{courseId}")
    public ResponseEntity<ApiResponse<ReviewEligibilityResponse>> getMyReview(
            @PathVariable UUID courseId,
            Authentication authentication) {
        UUID userId = securityAccessService.requireCurrentUserId(authentication);
        ReviewEligibilityResponse status = reviewService.getMyReviewStatus(userId, courseId);
        return ResponseEntity.ok(new ApiResponse<>("Review status retrieved successfully", status));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ReviewEligibilityResponse>>> getPendingReviewPrompts(Authentication authentication) {
        UUID userId = securityAccessService.requireCurrentUserId(authentication);
        return ResponseEntity.ok(new ApiResponse<>(
                "Pending review prompts retrieved successfully",
                reviewService.getPendingReviewPrompts(userId)
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable UUID id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(new ApiResponse<>("Review deleted successfully", null));
    }
}
