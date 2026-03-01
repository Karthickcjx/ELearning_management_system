package com.lms.dev.ai.adapter;

import com.lms.dev.ai.port.AiProviderPort;
import com.lms.dev.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GeminiAiProviderAdapter implements AiProviderPort {

    private final GeminiService geminiService;

    @Override
    public String generateAnswer(String prompt) {
        return geminiService.getChatResponse(prompt);
    }
}

