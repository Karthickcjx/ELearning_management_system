package com.lms.dev.room.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomCreateRequest {
    private String topic;
    private Integer preferredGroupSize;
    private String password;
}
