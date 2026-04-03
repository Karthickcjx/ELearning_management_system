package com.lms.dev.service;

import com.lms.dev.entity.EmailOtp;
import com.lms.dev.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailOtpRepository emailOtpRepository;
    private final EmailService emailService;

    public void generateAndSendOtp(String email) {
        Optional<EmailOtp> existingOtpOpt = emailOtpRepository.findByEmail(email);
        EmailOtp otpEntity;

        if (existingOtpOpt.isPresent()) {
            otpEntity = existingOtpOpt.get();
            if (otpEntity.getAttempts() >= 5 && otpEntity.getExpiryTime().isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Maximum OTP resend attempts reached. Please try again later.");
            }
        } else {
            otpEntity = EmailOtp.builder().email(email).build();
        }

        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        // Do not log the actual OTP
        log.info("Generated new OTP for email: {}", email);

        otpEntity.setOtpCode(otp);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        otpEntity.setVerified(false);
        otpEntity.setAttempts(otpEntity.getAttempts() + 1);

        emailOtpRepository.save(otpEntity);
        emailService.sendOtpEmail(email, otp);
    }

    public boolean verifyOtp(String email, String otpCode) {
        Optional<EmailOtp> existingOtpOpt = emailOtpRepository.findByEmail(email);

        if (existingOtpOpt.isEmpty()) {
            return false;
        }

        EmailOtp otpEntity = existingOtpOpt.get();

        if (otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            return false; // Expired
        }

        if (otpEntity.getOtpCode().equals(otpCode)) {
            otpEntity.setVerified(true);
            emailOtpRepository.save(otpEntity);
            return true;
        }

        return false;
    }

    public void deleteOtp(String email) {
        emailOtpRepository.findByEmail(email).ifPresent(emailOtpRepository::delete);
    }
}
