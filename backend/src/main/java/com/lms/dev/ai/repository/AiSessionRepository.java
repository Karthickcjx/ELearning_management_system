package com.lms.dev.ai.repository;

import com.lms.dev.ai.entity.AiSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiSessionRepository extends JpaRepository<AiSession, UUID> {

    Optional<AiSession> findByIdAndUserId(UUID id, UUID userId);

    List<AiSession> findTop10ByUserIdOrderByLastActivityAtDesc(UUID userId);
}

