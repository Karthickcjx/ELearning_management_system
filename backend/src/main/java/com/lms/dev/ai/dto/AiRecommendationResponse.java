package com.lms.dev.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendationResponse {
    private Long id;
    private UUID courseId;
    private String courseName;
    private String lessonId;
    private BigDecimal score;
    private String reason;
    private String modelVersion;
    private LocalDateTime expiresAt;
}

