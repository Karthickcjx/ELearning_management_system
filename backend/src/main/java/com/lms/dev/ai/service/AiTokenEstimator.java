package com.lms.dev.ai.service;

import org.springframework.stereotype.Component;

@Component
public class AiTokenEstimator {

    public int estimate(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }
}

