package com.lms.dev.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAiSessionRequest {
    private UUID courseId;
    private String lessonId;
}

