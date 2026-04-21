package com.lms.dev.auth.service;

import com.lms.dev.auth.config.BrevoProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrevoEmailService {

    private static final String SUBJECT_FMT = "%s verification code";

    private final RestClient brevoRestClient;
    private final BrevoProperties props;

    @Value("${app.name:EduVerse}")
    private String appName;

    private volatile String cachedTemplate;

    @Async
    public void sendOtpEmail(String to, String otp, int expiryMinutes) {
        String html;
        try {
            html = renderTemplate(otp, expiryMinutes);
        } catch (IOException e) {
            log.error("Failed to load OTP email template", e);
            return;
        }

        Map<String, Object> payload = Map.of(
                "sender", Map.of("email", props.getSenderEmail(), "name", props.getSenderName()),
                "to", List.of(Map.of("email", to)),
                "subject", String.format(SUBJECT_FMT, appName),
                "htmlContent", html
        );

        try {
            brevoRestClient.post()
                    .uri("/smtp/email")
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Brevo OTP email dispatched to {}", to);
        } catch (RestClientResponseException e) {
            log.error("Brevo API error ({}): {} -> {}", e.getStatusCode(), to, e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Brevo dispatch failed for {}: {}", to, e.getMessage());
        }
    }

    private String renderTemplate(String otp, int expiryMinutes) throws IOException {
        if (cachedTemplate == null) {
            synchronized (this) {
                if (cachedTemplate == null) {
                    try (var in = new ClassPathResource("templates/otp-email.html").getInputStream()) {
                        cachedTemplate = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
            }
        }
        return cachedTemplate
                .replace("{{OTP}}", otp)
                .replace("{{APP_NAME}}", appName)
                .replace("{{EXPIRY_MINUTES}}", String.valueOf(expiryMinutes))
                .replace("{{YEAR}}", String.valueOf(Year.now().getValue()));
    }
}
