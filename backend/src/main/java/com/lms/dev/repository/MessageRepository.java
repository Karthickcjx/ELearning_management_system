package com.lms.dev.repository;

import com.lms.dev.entity.Message;
import com.lms.dev.enums.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByReceiverIdOrderBySentAtDesc(UUID receiverId);

    List<Message> findBySenderIdOrderBySentAtDesc(UUID senderId);

    long countByReceiverIdAndStatus(UUID receiverId, MessageStatus status);
}
