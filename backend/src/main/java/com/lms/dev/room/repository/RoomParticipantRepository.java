package com.lms.dev.room.repository;

import com.lms.dev.room.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    boolean existsBySessionIdAndUserId(UUID sessionId, UUID userId);

    Optional<RoomParticipant> findBySessionIdAndUserId(UUID sessionId, UUID userId);

    List<RoomParticipant> findBySessionIdOrderByJoinedAtAsc(UUID sessionId);

    List<RoomParticipant> findTop20ByUserIdOrderByJoinedAtDesc(UUID userId);
}

