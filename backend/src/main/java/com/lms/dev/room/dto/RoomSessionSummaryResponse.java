package com.lms.dev.room.dto;

import com.lms.dev.room.enums.RoomSessionStatus;
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
public class RoomSessionSummaryResponse {
    private UUID roomId;
    private String topic;
    private int skillBand;
    private int groupSize;
    private int memberCount;
    private RoomSessionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}

