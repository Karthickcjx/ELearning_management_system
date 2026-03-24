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
public class ProgressResponse {
    private UUID userId;
    private UUID courseId;
    private float playedTime;
    private float duration;
    private int progressPercent;
}
