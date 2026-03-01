package com.lms.dev.room.dto;

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
public class RoomWhiteboardEvent {
    private UUID roomId;
    private UUID senderId;
    private String senderName;
    private Double fromX;
    private Double fromY;
    private Double toX;
    private Double toY;
    private String color;
    private Double strokeWidth;
    private Boolean eraser;
    private Boolean clearBoard;
    private LocalDateTime timestamp;
}

