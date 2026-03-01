package com.lms.dev.room.dto;

import com.lms.dev.room.enums.RoomChatSenderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomChatEvent {
    private Long id;
    private UUID roomId;
    private UUID senderId;
    private String senderName;
    private RoomChatSenderType senderType;
    private String message;
    private LocalDateTime timestamp;
}

