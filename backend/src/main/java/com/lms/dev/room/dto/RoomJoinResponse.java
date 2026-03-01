package com.lms.dev.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomJoinResponse {
    private RoomJoinStatus status;
    private UUID roomId;
    private String topic;
    private double skillScore;
    private int skillBand;
    private int groupSize;
    private int memberCount;
    private List<RoomMemberResponse> members;
    private String message;
    private LocalDateTime matchedAt;
}

