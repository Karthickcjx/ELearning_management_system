package com.lms.dev.controller;

import com.lms.dev.entity.User;
import com.lms.dev.security.SecurityAccessService;
import com.lms.dev.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SecurityAccessService securityAccessService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        return userService.getUserById(id);
    }

    @GetMapping("/{id}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        User user = userService.getUserById(id);
        if (user == null || user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(user.getProfileImage());
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<String> uploadProfileImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        try {
            userService.updateUserProfile(file, id);
            return ResponseEntity.ok("Image uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading image");
        }
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable UUID id, @RequestBody User updatedUser, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        return userService.updateUser(id, updatedUser);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable UUID id, Authentication authentication) {
        securityAccessService.assertSelfOrAdmin(authentication, id);
        userService.deleteUser(id);
    }

    @GetMapping("/details")
    public User getUserByEmail(@RequestParam String email, Authentication authentication) {
        securityAccessService.assertEmailAccess(authentication, email);
        return userService.getUserByEmail(email);
    }
}
