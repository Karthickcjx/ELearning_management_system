package com.lms.dev.auth.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "app.brevo")
public class BrevoProperties {
    private String apiKey;
    @NotBlank private String senderEmail;
    @NotBlank private String senderName;
    @NotNull  private Integer timeoutMs = 5000;
}
