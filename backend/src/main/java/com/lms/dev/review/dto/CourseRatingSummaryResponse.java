package com.lms.dev.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseRatingSummaryResponse {
    private UUID courseId;
    private double averageRating;
    private long reviewCount;
    private Map<Integer, Long> ratingDistribution;
}
