package com.lms.dev.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LearningResponse {
    private UUID id;
    private UUID userId;
    private UUID courseId;
    private String courseName;
}
