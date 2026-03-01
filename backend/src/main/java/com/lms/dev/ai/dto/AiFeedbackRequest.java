package com.lms.dev.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiFeedbackRequest {
    private int vote;
    private String comment;
}

