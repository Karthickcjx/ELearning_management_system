package com.lms.dev.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CohereStreamEvent {
    private String type;
    private String text;
    private int inputTokens;
    private int outputTokens;

    public static CohereStreamEvent token(String text) {
        return new CohereStreamEvent("token", text, 0, 0);
    }

    public static CohereStreamEvent done(int inputTokens, int outputTokens) {
        return new CohereStreamEvent("done", "", inputTokens, outputTokens);
    }
}
