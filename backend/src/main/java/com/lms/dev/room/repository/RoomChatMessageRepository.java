package com.lms.dev.room.repository;

import com.lms.dev.room.entity.RoomChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RoomChatMessageRepository extends JpaRepository<RoomChatMessage, Long> {

    List<RoomChatMessage> findBySessionIdOrderByCreatedAtDesc(UUID sessionId, Pageable pageable);
}

