package com.lms.dev.roadmap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DomainLearningPlanDTO {
    private List<String> toolsAndTechnologies;
    private List<String> practiceActivities;
}
