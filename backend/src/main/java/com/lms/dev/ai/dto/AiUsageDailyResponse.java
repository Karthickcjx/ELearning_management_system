package com.lms.dev.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiUsageDailyResponse {
    private LocalDate usageDate;
    private int requestCount;
    private int inputTokens;
    private int outputTokens;
}

