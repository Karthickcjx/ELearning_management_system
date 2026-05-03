package com.lms.dev.ai.adapter;

import com.lms.dev.ai.port.AiProviderPort;
import com.lms.dev.chat.service.CohereService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CohereProviderAdapter implements AiProviderPort {

    private final CohereService cohereService;

    @Override
    public String generateAnswer(String prompt) {
        return cohereService.getChatResponse(prompt);
    }
}
