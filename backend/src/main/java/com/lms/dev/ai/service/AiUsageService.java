package com.lms.dev.ai.service;

import com.lms.dev.ai.dto.AiUsageDailyResponse;
import com.lms.dev.ai.entity.AiUsageDaily;
import com.lms.dev.ai.repository.AiUsageDailyRepository;
import com.lms.dev.entity.User;
import com.lms.dev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiUsageService {

    private final AiUsageDailyRepository usageDailyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void incrementRequestAndInput(UUID userId, int inputTokens) {
        AiUsageDaily usage = getOrCreate(LocalDate.now(), userId);
        usage.setRequestCount(usage.getRequestCount() + 1);
        usage.setInputTokens(usage.getInputTokens() + Math.max(inputTokens, 0));
        usageDailyRepository.save(usage);
    }

    @Transactional
    public void incrementOutput(UUID userId, int outputTokens) {
        AiUsageDaily usage = getOrCreate(LocalDate.now(), userId);
        usage.setOutputTokens(usage.getOutputTokens() + Math.max(outputTokens, 0));
        usageDailyRepository.save(usage);
    }

    @Transactional(readOnly = true)
    public AiUsageDailyResponse getTodayUsage(UUID userId) {
        LocalDate today = LocalDate.now();
        AiUsageDaily usage = usageDailyRepository.findByUsageDateAndUserId(today, userId)
                .orElse(AiUsageDaily.builder()
                        .usageDate(today)
                        .requestCount(0)
                        .inputTokens(0)
                        .outputTokens(0)
                        .build());

        return AiUsageDailyResponse.builder()
                .usageDate(today)
                .requestCount(usage.getRequestCount())
                .inputTokens(usage.getInputTokens())
                .outputTokens(usage.getOutputTokens())
                .build();
    }

    private AiUsageDaily getOrCreate(LocalDate date, UUID userId) {
        return usageDailyRepository.findByUsageDateAndUserId(date, userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    return AiUsageDaily.builder()
                            .usageDate(date)
                            .user(user)
                            .requestCount(0)
                            .inputTokens(0)
                            .outputTokens(0)
                            .build();
                });
    }
}

