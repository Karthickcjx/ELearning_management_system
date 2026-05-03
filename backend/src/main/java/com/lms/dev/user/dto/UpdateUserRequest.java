package com.lms.dev.user.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String username;
    private String dob;
    private String mobileNumber;
    private String gender;
    private String location;
    private String profession;
    private String linkedin_url;
    private String github_url;
    private String occupation;
    private String learningField;
}
