package com.lms.dev.dto;

import com.lms.dev.entity.User;
import com.lms.dev.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
public class UserSummaryDTO {
    private UUID id;
    private String username;
    private String email;
    private UserRole role;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static UserSummaryDTO from(User user) {
        return new UserSummaryDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt()
        );
    }
}
