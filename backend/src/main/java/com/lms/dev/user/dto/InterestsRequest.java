package com.lms.dev.user.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class InterestsRequest {
    private UUID userId;
    private String learningField;
    private String occupation;
}
