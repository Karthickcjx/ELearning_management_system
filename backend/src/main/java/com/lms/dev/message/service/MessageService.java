package com.lms.dev.message.service;

import com.lms.dev.announcement.dto.BroadcastMessageRequest;
import com.lms.dev.message.dto.MessageResponse;
import com.lms.dev.message.dto.SendMessageRequest;
import com.lms.dev.message.entity.Message;
import com.lms.dev.user.entity.User;
import com.lms.dev.message.enums.MessageStatus;
import com.lms.dev.message.enums.MessageType;
import com.lms.dev.user.enums.UserRole;
import com.lms.dev.message.repository.MessageRepository;
import com.lms.dev.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageResponse sendMessage(UUID senderId, SendMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .subject(request.getSubject())
                .content(request.getContent())
                .status(MessageStatus.UNREAD)
                .messageType(MessageType.MESSAGE)
                .build();

        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    /**
     * Get inbox messages for a user (MESSAGE type only, not notifications).
     */
    public List<MessageResponse> getInboxMessages(UUID userId) {
        List<Message> messages = messageRepository.findByReceiverIdAndMessageTypeOrderBySentAtDesc(
                userId, MessageType.MESSAGE);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Get all messages for a student (all types — used by notifications page).
     */
    public List<MessageResponse> getStudentMessages(UUID studentId) {
        List<Message> messages = messageRepository.findByReceiverIdOrderBySentAtDesc(studentId);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Get sent messages for a user (MESSAGE type only).
     */
    public List<MessageResponse> getSentMessages(UUID senderId) {
        List<Message> messages = messageRepository.findBySenderIdAndMessageTypeOrderBySentAtDesc(
                senderId, MessageType.MESSAGE);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Get conversation thread between two users, sorted chronologically.
     */
    public List<MessageResponse> getConversation(UUID user1Id, UUID user2Id) {
        List<Message> messages = messageRepository.findConversation(user1Id, user2Id, MessageType.MESSAGE);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse markAsRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (!message.getReceiver().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only mark your own messages as read");
        }

        message.setStatus(MessageStatus.READ);
        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    @Transactional
    public List<MessageResponse> broadcastMessage(UUID senderId, BroadcastMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        List<User> students = userRepository.findByRole(UserRole.USER);
        List<MessageResponse> responses = new ArrayList<>();

        for (User student : students) {
            Message message = Message.builder()
                    .sender(sender)
                    .receiver(student)
                    .subject(request.getSubject())
                    .content(request.getContent())
                    .status(MessageStatus.UNREAD)
                    .messageType(MessageType.MESSAGE)
                    .build();

            Message saved = messageRepository.save(message);
            responses.add(toResponse(saved));
        }

        return responses;
    }

    private MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .messageId(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getUsername())
                .senderEmail(message.getSender().getEmail())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getUsername())
                .receiverEmail(message.getReceiver().getEmail())
                .subject(message.getSubject())
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .status(message.getStatus())
                .messageType(message.getMessageType().name())
                .build();
    }
}
