package com.lms.dev.review.repository;

import java.util.UUID;

public interface CourseRatingStatsProjection {
    UUID getCourseId();

    Double getAverageRating();

    Long getReviewCount();
}
