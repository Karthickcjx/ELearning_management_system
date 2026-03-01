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
public class RoomHintEvent {
    private UUID roomId;
    private String hint;
    private String requestedBy;
    private LocalDateTime timestamp;
}

