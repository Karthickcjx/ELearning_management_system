package com.lms.dev.ai.repository;

import com.lms.dev.ai.entity.AiMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    @Query("select m from AiMessage m where m.session.id = :sessionId order by m.createdAt desc")
    List<AiMessage> findRecentBySessionId(@Param("sessionId") UUID sessionId, Pageable pageable);
}

