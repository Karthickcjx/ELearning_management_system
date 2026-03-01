package com.lms.dev.room.repository;

import com.lms.dev.room.entity.RoomSession;
import com.lms.dev.room.enums.RoomSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomSessionRepository extends JpaRepository<RoomSession, UUID> {

    Optional<RoomSession> findByIdAndStatus(UUID id, RoomSessionStatus status);

    List<RoomSession> findTop20ByStatusOrderByCreatedAtDesc(RoomSessionStatus status);
}

