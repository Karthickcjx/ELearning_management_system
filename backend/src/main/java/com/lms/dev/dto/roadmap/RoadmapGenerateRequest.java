package com.lms.dev.dto.roadmap;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapGenerateRequest {

    @NotBlank(message = "Domain is required")
    private String domain;

    @Pattern(
            regexp = "(?i)beginner|intermediate|advanced",
            message = "Level must be Beginner, Intermediate, or Advanced"
    )
    private String level = "Beginner";

    private String targetRole;

    @Min(value = 1, message = "Weekly hours must be at least 1")
    @Max(value = 80, message = "Weekly hours must be less than or equal to 80")
    private Integer weeklyHours;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate targetDate;
}
