package com.lms.dev.dto.roadmap;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoadmapStepStatusRequest {
    private boolean completed;
}
