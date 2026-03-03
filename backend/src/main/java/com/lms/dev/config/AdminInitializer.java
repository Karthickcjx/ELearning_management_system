package com.lms.dev.config;

import com.lms.dev.entity.User;
import com.lms.dev.enums.UserRole;
import com.lms.dev.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Slf4j
public class AdminInitializer {

    @Value("${app.default-admin.enabled:false}")
    private boolean defaultAdminEnabled;

    @Value("${app.default-admin.username:}")
    private String defaultUsername;

    @Value("${app.default-admin.password:}")
    private String defaultPassword;

    @Value("${app.default-admin.email:}")
    private String defaultEmail;

    @Bean
    public CommandLineRunner createDefaultAdmin(UserRepository userRepository,
                                                PasswordEncoder passwordEncoder) {
        return args -> {
            if (!defaultAdminEnabled) {
                log.info("Default admin bootstrap is disabled.");
                return;
            }

            if (isBlank(defaultUsername) || isBlank(defaultPassword) || isBlank(defaultEmail)) {
                log.warn("Default admin bootstrap enabled, but credentials are missing. Skipping admin creation.");
                return;
            }

            if (!userRepository.existsByRole(UserRole.ADMIN)) {
                User admin = new User();
                admin.setUsername(defaultUsername);
                admin.setPassword(passwordEncoder.encode(defaultPassword));
                admin.setEmail(defaultEmail);
                admin.setRole(UserRole.ADMIN);
                userRepository.save(admin);
                log.info("Default admin user created.");
            } else {
                log.info("Admin user already exists, skipping creation.");
            }
        };
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
