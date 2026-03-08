package com.lms.dev.dto;

import com.lms.dev.enums.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageResponse {
    private UUID messageId;
    private String senderName;
    private String senderEmail;
    private String receiverName;
    private String receiverEmail;
    private String subject;
    private String content;
    private LocalDateTime sentAt;
    private MessageStatus status;
}
