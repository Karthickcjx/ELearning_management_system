package com.lms.dev.service;

import com.lms.dev.dto.BroadcastMessageRequest;
import com.lms.dev.dto.MessageResponse;
import com.lms.dev.dto.SendMessageRequest;
import com.lms.dev.entity.Message;
import com.lms.dev.entity.User;
import com.lms.dev.enums.MessageStatus;
import com.lms.dev.enums.UserRole;
import com.lms.dev.repository.MessageRepository;
import com.lms.dev.repository.UserRepository;
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
                .build();

        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    public List<MessageResponse> getStudentMessages(UUID studentId) {
        List<Message> messages = messageRepository.findByReceiverIdOrderBySentAtDesc(studentId);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MessageResponse> getSentMessages(UUID senderId) {
        List<Message> messages = messageRepository.findBySenderIdOrderBySentAtDesc(senderId);
        return messages.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse markAsRead(UUID messageId, UUID studentId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (!message.getReceiver().getId().equals(studentId)) {
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
                    .build();

            Message saved = messageRepository.save(message);
            responses.add(toResponse(saved));
        }

        return responses;
    }

    private MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .messageId(message.getId())
                .senderName(message.getSender().getUsername())
                .senderEmail(message.getSender().getEmail())
                .receiverName(message.getReceiver().getUsername())
                .receiverEmail(message.getReceiver().getEmail())
                .subject(message.getSubject())
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .status(message.getStatus())
                .build();
    }
}
