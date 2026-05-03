package com.lms.dev.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendOtpRequestDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    private String email;
}
