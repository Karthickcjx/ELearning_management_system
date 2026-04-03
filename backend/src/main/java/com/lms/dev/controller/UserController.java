package com.lms.dev.controller;

import com.lms.dev.dto.ApiResponse;
import com.lms.dev.dto.UpdateUserRequest;
import com.lms.dev.dto.UserSummaryDTO;
import com.lms.dev.entity.User;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SecurityAccessService securityAccessService;

    private static final List<String> ALLOWED_IMAGE_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_IMAGE_SIZE = 2L * 1024 * 1024; // 2 MB

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryDTO>>> getAllUsers() {
        List<UserSummaryDTO> users = userService.getAllUsers()
                .stream()
                .map(UserSummaryDTO::from)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>("Users retrieved successfully", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User user = userService.getUserById(id);
        return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", user));
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User user = userService.getUserById(id);
        if (user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(user.getProfileImage());
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<ApiResponse<Void>> uploadProfileImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Only JPEG, PNG, WebP, or GIF images are allowed", null));
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("File size must not exceed 2 MB", null));
        }

        try {
            userService.updateUserProfile(file, id);
            return ResponseEntity.ok(new ApiResponse<>("Image uploaded successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Error uploading image", null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User updated = userService.updateUser(id, request);
        return ResponseEntity.ok(new ApiResponse<>("User updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse<>("User deleted successfully", null));
    }

    @GetMapping("/details")
    public ResponseEntity<ApiResponse<User>> getUserByEmail(
            @RequestParam String email, Authentication authentication) {
        securityAccessService.assertEmailAccess(authentication, email);
        User user = userService.getUserByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>("User retrieved successfully", user));
    }

    @GetMapping("/{id}/dashboard-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(
            @PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        Map<String, Object> stats = userService.getUserDashboardStats(id);
        return ResponseEntity.ok(new ApiResponse<>("Dashboard stats retrieved", stats));
    }
}
