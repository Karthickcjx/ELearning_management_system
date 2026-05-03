package com.lms.dev.message.repository;

import com.lms.dev.message.entity.Message;
import com.lms.dev.message.enums.MessageStatus;
import com.lms.dev.message.enums.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByReceiverIdOrderBySentAtDesc(UUID receiverId);

    List<Message> findBySenderIdOrderBySentAtDesc(UUID senderId);

    long countByReceiverIdAndStatus(UUID receiverId, MessageStatus status);

    // Inbox: messages received by a user (MESSAGE type only)
    List<Message> findByReceiverIdAndMessageTypeOrderBySentAtDesc(UUID receiverId, MessageType messageType);

    // Sent: messages sent by a user (MESSAGE type only)
    List<Message> findBySenderIdAndMessageTypeOrderBySentAtDesc(UUID senderId, MessageType messageType);

    // Conversation between two users (both directions), sorted chronologically
    @Query("SELECT m FROM Message m WHERE m.messageType = :messageType " +
            "AND ((m.sender.id = :user1 AND m.receiver.id = :user2) " +
            "OR (m.sender.id = :user2 AND m.receiver.id = :user1)) " +
            "ORDER BY m.sentAt ASC")
    List<Message> findConversation(
            @Param("user1") UUID user1,
            @Param("user2") UUID user2,
            @Param("messageType") MessageType messageType);
}
