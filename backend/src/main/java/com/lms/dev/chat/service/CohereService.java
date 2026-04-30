package com.lms.dev.chat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.dev.chat.dto.ChatStreamMessage;
import com.lms.dev.chat.dto.ChatStreamRequest;
import com.lms.dev.chat.dto.CohereStreamEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Slf4j
public class CohereService {

    private static final URI COHERE_CHAT_URI = URI.create("https://api.cohere.com/v2/chat");
    private static final String DEFAULT_MODEL = "command-r7b-12-2024";
    private static final int MAX_HISTORY_MESSAGES = 16;
    private static final int MAX_MESSAGE_LENGTH = 4000;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${app.cohere.api-key:}")
    private String apiKey;

    @Value("${app.cohere.model:command-r7b-12-2024}")
    private String modelVersion;

    public String getChatResponse(String userMessage) {
        ChatStreamRequest request = new ChatStreamRequest(
                List.of(new ChatStreamMessage("user", userMessage)),
                "All"
        );

        Map<String, Object> requestBody = buildRequestBody(request, false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resolveApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                @SuppressWarnings("rawtypes")
                ResponseEntity<Map> response = restTemplate.postForEntity(COHERE_CHAT_URI, entity, Map.class);

                JsonNode responseBody = objectMapper.valueToTree(response.getBody());
                String answer = extractAssistantText(responseBody);
                if (answer == null || answer.isBlank()) {
                    throw new IllegalStateException("Cohere returned an empty response");
                }
                return answer;
            } catch (HttpStatusCodeException e) {
                int statusCode = e.getStatusCode().value();
                String responseBody = e.getResponseBodyAsString();
                log.error("Cohere API request failed with status {}: {}", statusCode, responseBody);
                handleRetryableStatus(statusCode, responseBody, attempt, maxRetries, e);
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

    public void streamChatResponse(ChatStreamRequest request, Consumer<CohereStreamEvent> eventConsumer) {
        String requestJson;
        try {
            requestJson = objectMapper.writeValueAsString(buildRequestBody(request, true));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to build Cohere request", e);
        }

        HttpRequest httpRequest = HttpRequest.newBuilder(COHERE_CHAT_URI)
                .timeout(Duration.ofMinutes(2))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + resolveApiKey())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.ACCEPT, MediaType.TEXT_EVENT_STREAM_VALUE)
                .header("X-Client-Name", "EduVerse LMS")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<InputStream> response;
        try {
            response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofInputStream());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI provider request interrupted", e);
        } catch (IOException e) {
            throw new IllegalStateException("AI provider request failed", e);
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw toProviderException(response);
        }

        readCohereEventStream(response.body(), eventConsumer);
    }

    private Map<String, Object> buildRequestBody(ChatStreamRequest request, boolean stream) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", resolveModel());
        requestBody.put("messages", buildMessages(request));
        requestBody.put("stream", stream);
        requestBody.put("temperature", 0.25);
        return requestBody;
    }

    private List<Map<String, String>> buildMessages(ChatStreamRequest request) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(message("system", buildSystemPrompt(request == null ? null : request.getSubject())));

        List<ChatStreamMessage> incomingMessages = request == null ? List.of() : request.getMessages();
        if (incomingMessages == null || incomingMessages.isEmpty()) {
            throw new IllegalArgumentException("At least one chat message is required");
        }

        incomingMessages.stream()
                .filter(this::isUsableMessage)
                .skip(Math.max(0, incomingMessages.size() - MAX_HISTORY_MESSAGES))
                .map(this::toCohereMessage)
                .forEach(messages::add);

        if (messages.size() <= 1) {
            throw new IllegalArgumentException("At least one user or assistant message is required");
        }

        return messages;
    }

    private boolean isUsableMessage(ChatStreamMessage message) {
        if (message == null || message.getContent() == null || message.getContent().isBlank()) {
            return false;
        }
        String role = normalizeRole(message.getRole());
        return "user".equals(role) || "assistant".equals(role);
    }

    private Map<String, String> toCohereMessage(ChatStreamMessage message) {
        return message(normalizeRole(message.getRole()), truncate(message.getContent().trim(), MAX_MESSAGE_LENGTH));
    }

    private Map<String, String> message(String role, String content) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String buildSystemPrompt(String subject) {
        String selectedSubject = (subject == null || subject.isBlank()) ? "All" : subject.trim();
        return "You are a helpful AI tutor in a learning management system. "
                + "Answer student questions clearly and educationally. "
                + "Adapt your explanation to the selected subject filter: " + selectedSubject + ". "
                + "When useful, give short steps, examples, and a quick check for understanding.";
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.trim().toLowerCase(Locale.ROOT);
    }

    private String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private void readCohereEventStream(InputStream body, Consumer<CohereStreamEvent> eventConsumer) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(body, StandardCharsets.UTF_8))) {
            String line;
            StringBuilder data = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    handleSseData(data.toString(), eventConsumer);
                    data.setLength(0);
                    continue;
                }

                if (line.startsWith("data:")) {
                    if (data.length() > 0) {
                        data.append('\n');
                    }
                    data.append(line.substring(5).stripLeading());
                }
            }

            if (data.length() > 0) {
                handleSseData(data.toString(), eventConsumer);
            }
        } catch (IOException e) {
            throw new IllegalStateException("AI provider stream failed", e);
        }
    }

    private void handleSseData(String data, Consumer<CohereStreamEvent> eventConsumer) {
        if (data == null || data.isBlank() || "[DONE]".equals(data.trim())) {
            return;
        }

        JsonNode event;
        try {
            event = objectMapper.readTree(data);
        } catch (JsonProcessingException e) {
            log.debug("Skipping unparsable Cohere stream event: {}", data);
            return;
        }

        String type = event.path("type").asText();
        if ("content-delta".equals(type)) {
            String token = event.at("/delta/message/content/text").asText("");
            if (!token.isEmpty()) {
                eventConsumer.accept(CohereStreamEvent.token(token));
            }
        } else if ("message-end".equals(type)) {
            JsonNode usage = event.at("/delta/usage");
            int inputTokens = extractTokenCount(usage, "input_tokens");
            int outputTokens = extractTokenCount(usage, "output_tokens");
            eventConsumer.accept(CohereStreamEvent.done(inputTokens, outputTokens));
        }
    }

    private int extractTokenCount(JsonNode usage, String fieldName) {
        JsonNode tokensValue = usage.path("tokens").path(fieldName);
        if (tokensValue.isNumber()) {
            return tokensValue.asInt();
        }

        JsonNode billedValue = usage.path("billed_units").path(fieldName);
        return billedValue.isNumber() ? billedValue.asInt() : 0;
    }

    private String extractAssistantText(JsonNode responseBody) {
        if (responseBody == null || responseBody.isMissingNode() || responseBody.isNull()) {
            return null;
        }

        JsonNode content = responseBody.path("message").path("content");
        if (!content.isArray()) {
            return null;
        }

        StringBuilder answer = new StringBuilder();
        for (JsonNode contentPart : content) {
            String text = contentPart.path("text").asText("");
            if (!text.isBlank()) {
                answer.append(text);
            }
        }
        return answer.toString();
    }

    private RuntimeException toProviderException(HttpResponse<InputStream> response) {
        String responseBody;
        try {
            responseBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            responseBody = "";
        }

        int statusCode = response.statusCode();
        log.error("Cohere API stream failed with status {}: {}", statusCode, responseBody);

        return toProviderException(statusCode, responseBody, null);
    }

    private IllegalStateException toProviderException(int statusCode, String responseBody, Throwable cause) {
        String providerMessage = extractProviderErrorMessage(responseBody);

        if (statusCode == 401 || statusCode == 403 || statusCode == 498) {
            return new IllegalStateException("COHERE_API_KEY is invalid or lacks API permission", cause);
        }
        if (statusCode == 429 || statusCode == 503) {
            return new IllegalStateException("AI model is currently experiencing high demand. Please try again later.",
                    cause);
        }
        if ((statusCode == 400 || statusCode == 404 || statusCode == 422)
                && providerMessage.toLowerCase(Locale.ROOT).contains("model")) {
            return new IllegalStateException("COHERE_MODEL is invalid or unavailable for this API key", cause);
        }
        if (statusCode == 400 || statusCode == 422) {
            return new IllegalStateException("AI provider rejected the tutor request", cause);
        }
        return new IllegalStateException("AI provider request failed", cause);
    }

    private String extractProviderErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "";
        }

        try {
            JsonNode errorBody = objectMapper.readTree(responseBody);
            String message = errorBody.path("message").asText("");
            if (!message.isBlank()) {
                return message;
            }

            JsonNode error = errorBody.path("error");
            if (error.isTextual()) {
                return error.asText();
            }
            message = error.path("message").asText("");
            if (!message.isBlank()) {
                return message;
            }

            message = errorBody.path("detail").asText("");
            return message == null ? "" : message;
        } catch (JsonProcessingException ex) {
            return responseBody.trim();
        }
    }

    private void handleRetryableStatus(int statusCode, String responseBody, int attempt, int maxRetries,
                                       HttpStatusCodeException e) {
        if (statusCode == 503 || statusCode == 429) {
            if (attempt == maxRetries) {
                throw new IllegalStateException(
                        "AI model is currently experiencing high demand. Please try again later.", e);
            }
            log.info("Retrying Cohere API request (attempt {}/{}) after status {}", attempt, maxRetries, statusCode);
            try {
                Thread.sleep(1500L * attempt);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Thread interrupted during retry", ie);
            }
            return;
        }

        throw toProviderException(statusCode, responseBody, e);
    }

    private String resolveApiKey() {
        String key = apiKey == null ? "" : apiKey.trim();
        if (key.isEmpty() || isApiKeyPlaceholder(key)) {
            throw new IllegalStateException("COHERE_API_KEY is not configured");
        }
        return key;
    }

    private boolean isApiKeyPlaceholder(String key) {
        String normalized = key.trim().toLowerCase(Locale.ROOT);
        return "api key".equals(normalized)
                || "your-cohere-api-key-here".equals(normalized)
                || normalized.contains("your-cohere-api-key")
                || normalized.contains("replace-with");
    }

    private String resolveModel() {
        String model = modelVersion == null ? "" : modelVersion.trim();
        return model.isEmpty() ? DEFAULT_MODEL : model;
    }
}
