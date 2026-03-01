package com.lms.dev.ai.dto;

import com.lms.dev.ai.enums.AiMessageSender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessageResponse {
    private Long id;
    private AiMessageSender sender;
    private String content;
    private int tokenCount;
    private Integer latencyMs;
    private LocalDateTime createdAt;
}

