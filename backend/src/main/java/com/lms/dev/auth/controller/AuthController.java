package com.lms.dev.auth.controller;

import com.lms.dev.common.dto.ApiResponse;
import com.lms.dev.auth.dto.JwtResponseDTO;
import com.lms.dev.auth.dto.LoginRequestDTO;
import com.lms.dev.auth.dto.RegisterRequestDTO;
import com.lms.dev.auth.dto.SendOtpRequestDTO;
import com.lms.dev.auth.dto.ResetPasswordRequestDTO;
import com.lms.dev.user.dto.UserProfileDTO;
import com.lms.dev.user.entity.User;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.security.util.JwtUtils;
import com.lms.dev.user.service.UserService;
import com.lms.dev.auth.service.OtpService;
import com.lms.dev.user.enums.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final JwtUtils jwtUtils;
        private final UserService authService;
        private final OtpService otpService;

        @PostMapping("/login")
        public ResponseEntity<ApiResponse<JwtResponseDTO>> login(@Valid @RequestBody LoginRequestDTO loginRequest) {
                log.info("Login attempt for email: {}", loginRequest.getEmail());

                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                loginRequest.getEmail(),
                                                loginRequest.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                String jwt = jwtUtils.generateJwtToken(authentication);

                UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

                JwtResponseDTO jwtResponse = JwtResponseDTO.builder()
                                .token(jwt)
                                .type("Bearer")
                                .id(userPrincipal.getId())
                                .email(userPrincipal.getEmail())
                                .name(userPrincipal.getName())
                                .role(userPrincipal.getAuthorities().iterator().next().getAuthority())
                                .build();

                log.info("User logged in successfully: {}", loginRequest.getEmail());
                return ResponseEntity.ok(new ApiResponse<>("Login successful", jwtResponse));
        }

        @PostMapping("/register")
        public ResponseEntity<ApiResponse<UserProfileDTO>> register(@Valid @RequestBody RegisterRequestDTO signUpRequest) {
                log.info("Registration attempt for email: {}", signUpRequest.getEmail());

                if (!otpService.verifyOtp(signUpRequest.getEmail(), signUpRequest.getOtp())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(new ApiResponse<>("Invalid or expired OTP", null));
                }

                User userToCreate = User.builder()
                                .username(signUpRequest.getUsername())
                                .email(signUpRequest.getEmail())
                                .password(signUpRequest.getPassword())
                                .mobileNumber(signUpRequest.getMobileNumber())
                                .dob(signUpRequest.getDob())
                                .gender(signUpRequest.getGender())
                                .location(signUpRequest.getLocation())
                                .profession(signUpRequest.getProfession())
                                .linkedin_url(signUpRequest.getLinkedin_url())
                                .github_url(signUpRequest.getGithub_url())
                                .role(UserRole.USER)
                                .isActive(true)
                                .build();

                User user = authService.createUser(userToCreate);
                otpService.deleteOtp(signUpRequest.getEmail());

                log.info("User registered successfully: {}", signUpRequest.getEmail());
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(new ApiResponse<>("User registered successfully", UserProfileDTO.from(user)));
        }

        @PostMapping("/logout")
        public ResponseEntity<ApiResponse<Void>> logout() {
                SecurityContextHolder.clearContext();
                return ResponseEntity.ok(new ApiResponse<>("Logout successful", null));
        }

        @PostMapping("/send-otp")
        public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequestDTO request) {
                log.info("Sending OTP for email: {}", request.getEmail());
                try {
                        otpService.generateAndSendOtp(request.getEmail());
                        return ResponseEntity.ok(new ApiResponse<>("OTP sent successfully", null));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(new ApiResponse<>(e.getMessage(), null));
                }
        }

        @PostMapping("/reset-password")
        public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
                log.info("Password reset attempt for email: {}", request.getEmail());

                if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(new ApiResponse<>("Invalid or expired OTP", null));
                }

                try {
                        authService.updatePassword(request.getEmail(), request.getNewPassword());
                        otpService.deleteOtp(request.getEmail());
                        return ResponseEntity.ok(new ApiResponse<>("Password reset successfully", null));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(new ApiResponse<>(e.getMessage(), null));
                }
        }
}
