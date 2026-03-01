package com.lms.dev.ai.dto;

import com.lms.dev.ai.enums.AiSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSessionResponse {
    private UUID sessionId;
    private UUID courseId;
    private String lessonId;
    private AiSessionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime lastActivityAt;
}

