package com.lms.dev.ai.repository;

import com.lms.dev.ai.entity.AiUsageDaily;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface AiUsageDailyRepository extends JpaRepository<AiUsageDaily, Long> {

    Optional<AiUsageDaily> findByUsageDateAndUserId(LocalDate usageDate, UUID userId);
}

