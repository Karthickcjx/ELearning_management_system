package com.lms.dev.dto.roadmap;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapResponseDTO {
    private UUID planId;
    private String domain;
    private String level;
    private String targetRole;
    private Integer weeklyHours;
    private LocalDate targetDate;
    private DomainTheoryDTO theory;
    private DomainLearningPlanDTO learningPlan;
    private List<RoadmapStepDTO> steps;
    private double completionPercentage;
}
