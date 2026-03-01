package com.lms.dev.room.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomJoinRequest {
    private String topic;
    private Integer preferredGroupSize;
}

