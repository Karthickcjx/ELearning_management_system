package com.lms.dev.user.dto;

import com.lms.dev.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private UUID id;
    private String username;
    private String email;
    private String mobileNumber;
    private String dob;
    private String gender;
    private String location;
    private String profession;
    private String learningField;
    private String occupation;
    private String linkedin_url;
    private String github_url;
    private int learningCourseCount;

    public static UserProfileDTO from(User user) {
        int learningCourseCount = user.getLearningCourses() == null ? 0 : user.getLearningCourses().size();

        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .dob(user.getDob())
                .gender(user.getGender())
                .location(user.getLocation())
                .profession(user.getProfession())
                .learningField(user.getLearningField())
                .occupation(user.getOccupation())
                .linkedin_url(user.getLinkedin_url())
                .github_url(user.getGithub_url())
                .learningCourseCount(learningCourseCount)
                .build();
    }
}
