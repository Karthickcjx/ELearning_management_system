package com.lms.dev.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Service
@Slf4j
public class CohereService {

    @Value("${app.cohere.api-key:}")
    private String apiKey;

    @Value("${app.ai.model-version:command-r7b-12-2024}")
    private String modelVersion;

    public String getChatResponse(String userMessage) {
        String key = apiKey == null ? "" : apiKey.trim();
        if (key.isEmpty()) {
            throw new IllegalStateException("COHERE_API_KEY is not configured");
        }

        String model = (modelVersion == null || modelVersion.isBlank())
                ? "command-r7b-12-2024"
                : modelVersion.trim();
        String url = "https://api.cohere.ai/v1/chat";
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "message", userMessage);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(key);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                @SuppressWarnings("rawtypes")
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();

                String answer = extractAnswer(responseBody);
                if (answer == null || answer.isBlank()) {
                    throw new IllegalStateException("Cohere returned an empty response");
                }
                return answer;
            } catch (HttpStatusCodeException e) {
                int statusCode = e.getStatusCode().value();
                String responseBody = e.getResponseBodyAsString();
                log.error("Cohere API request failed with status {}: {}", statusCode, responseBody);

                if (statusCode == 503 || statusCode == 429) {
                    if (attempt == maxRetries) {
                        throw new IllegalStateException(
                                "AI model is currently experiencing high demand. Please try again later.", e);
                    }
                    log.info("Retrying Cohere API request (attempt {}/{}) after status {}", attempt, maxRetries,
                            statusCode);
                    try {
                        Thread.sleep(1500L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("Thread interrupted during retry", ie);
                    }
                    continue;
                }

                if (statusCode == 401 || statusCode == 403) {
                    throw new IllegalStateException("COHERE_API_KEY is invalid or lacks API permission", e);
                }
                throw new IllegalStateException("AI provider request failed", e);
            } catch (RestClientException e) {
                log.error("Cohere API request failed: {}", e.getMessage());
                throw new IllegalStateException("AI provider request failed", e);
            } catch (RuntimeException e) {
                if (attempt == maxRetries) {
                    log.error("Cohere response parsing failed: {}", e.getMessage());
                    throw e;
                }
            }
        }
        throw new IllegalStateException("Unexpected end of getChatResponse");
    }

    private String extractAnswer(Map<String, Object> responseBody) {
        if (responseBody == null) {
            return null;
        }

        Object textObj = responseBody.get("text");
        if (textObj instanceof String value) {
            return value;
        }

        return null;
    }
}
