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
public class RoomMediaSignalEvent {
    private UUID roomId;
    private UUID senderId;
    private String senderName;
    private UUID targetUserId;
    private String type;
    private String descriptionType;
    private String sdp;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
    private Boolean microphoneEnabled;
    private Boolean screenSharing;
    private LocalDateTime timestamp;
}
