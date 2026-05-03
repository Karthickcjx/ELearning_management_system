package com.lms.dev.auth.service;

import com.lms.dev.auth.entity.EmailOtp;
import com.lms.dev.auth.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_RESENDS_PER_HOUR = 5;
    private static final int MAX_VERIFY_ATTEMPTS = 5;

    private final EmailOtpRepository emailOtpRepository;
    private final BrevoEmailService brevoEmailService;
    private final PasswordEncoder passwordEncoder;

    public void generateAndSendOtp(String email) {
        LocalDateTime now = LocalDateTime.now();
        Optional<EmailOtp> existing = emailOtpRepository.findByEmail(email);
        EmailOtp entity;

        if (existing.isPresent()) {
            entity = existing.get();
            if (entity.getLastSentAt() != null
                    && Duration.between(entity.getLastSentAt(), now).getSeconds() < RESEND_COOLDOWN_SECONDS) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Please wait before requesting another OTP");
            }
            if (entity.getResendAttempts() >= MAX_RESENDS_PER_HOUR
                    && entity.getLastSentAt() != null
                    && Duration.between(entity.getLastSentAt(), now).toHours() < 1) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Resend limit reached. Try again later");
            }
        } else {
            entity = EmailOtp.builder().email(email).build();
        }

        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        entity.setOtpHash(passwordEncoder.encode(otp));
        entity.setExpiryTime(now.plusMinutes(OTP_EXPIRY_MINUTES));
        entity.setLastSentAt(now);
        entity.setUsed(false);
        entity.setAttempts(0);
        entity.setResendAttempts(entity.getResendAttempts() + 1);

        emailOtpRepository.save(entity);
        brevoEmailService.sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
        log.info("OTP generated for {}", email);
    }

    public boolean verifyOtp(String email, String otpCode) {
        Optional<EmailOtp> existing = emailOtpRepository.findByEmail(email);
        if (existing.isEmpty()) return false;

        EmailOtp entity = existing.get();
        if (entity.isUsed()) return false;
        if (entity.getExpiryTime().isBefore(LocalDateTime.now())) return false;
        if (entity.getAttempts() >= MAX_VERIFY_ATTEMPTS) return false;

        boolean match = passwordEncoder.matches(otpCode, entity.getOtpHash());
        if (!match) {
            entity.setAttempts(entity.getAttempts() + 1);
            emailOtpRepository.save(entity);
            return false;
        }

        entity.setUsed(true);
        emailOtpRepository.save(entity);
        return true;
    }

    public void deleteOtp(String email) {
        emailOtpRepository.findByEmail(email).ifPresent(emailOtpRepository::delete);
    }
}
