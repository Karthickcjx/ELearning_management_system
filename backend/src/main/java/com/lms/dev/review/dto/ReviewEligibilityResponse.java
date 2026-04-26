package com.lms.dev.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewEligibilityResponse {
    private UUID courseId;
    private String courseName;
    private boolean eligible;
    private boolean enrolled;
    private boolean hasReview;
    private int progressPercent;
    private String message;
    private ReviewResponse review;
}
