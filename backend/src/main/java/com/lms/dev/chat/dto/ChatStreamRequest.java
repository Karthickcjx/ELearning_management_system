package com.lms.dev.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatStreamRequest {
    private List<ChatStreamMessage> messages;
    private String subject;
}
