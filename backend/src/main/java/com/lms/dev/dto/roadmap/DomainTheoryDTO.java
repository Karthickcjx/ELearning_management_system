package com.lms.dev.dto.roadmap;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DomainTheoryDTO {
    private String overview;
    private List<String> keyPrinciples;
    private List<String> careerOutcomes;
}
