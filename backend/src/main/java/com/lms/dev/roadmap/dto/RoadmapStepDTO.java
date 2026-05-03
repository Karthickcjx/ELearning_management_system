package com.lms.dev.roadmap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapStepDTO {
    private int stepOrder;
    private String title;
    private String description;
    private boolean completed;
}
