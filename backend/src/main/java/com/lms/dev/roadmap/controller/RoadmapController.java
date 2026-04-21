package com.lms.dev.roadmap.controller;

import com.lms.dev.common.dto.ApiResponse;
import com.lms.dev.roadmap.dto.RoadmapGenerateRequest;
import com.lms.dev.roadmap.dto.RoadmapResponseDTO;
import com.lms.dev.roadmap.dto.RoadmapStepStatusRequest;
import com.lms.dev.security.UserPrincipal;
import com.lms.dev.roadmap.service.RoadmapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/roadmaps")
@RequiredArgsConstructor
@Validated
public class RoadmapController {

    private final RoadmapService roadmapService;

    @GetMapping("/domains")
    public ResponseEntity<ApiResponse<List<String>>> getAvailableDomains() {
        List<String> domains = roadmapService.getAvailableDomains();
        return ResponseEntity.ok(new ApiResponse<>("Domains fetched successfully", domains));
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<RoadmapResponseDTO>> previewRoadmap(
            @Valid @RequestBody RoadmapGenerateRequest request
    ) {
        RoadmapResponseDTO roadmap = roadmapService.previewRoadmap(request);
        return ResponseEntity.ok(new ApiResponse<>("Roadmap preview generated", roadmap));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoadmapResponseDTO>> createRoadmap(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RoadmapGenerateRequest request
    ) {
        RoadmapResponseDTO roadmap = roadmapService.createRoadmapForCurrentUser(userPrincipal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Roadmap saved successfully", roadmap));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<RoadmapResponseDTO>>> getMyRoadmaps(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<RoadmapResponseDTO> roadmaps = roadmapService.getRoadmapsForCurrentUser(userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>("Roadmaps fetched successfully", roadmaps));
    }

    @PatchMapping("/{planId}/steps/{stepOrder}")
    public ResponseEntity<ApiResponse<RoadmapResponseDTO>> updateStepStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID planId,
            @PathVariable int stepOrder,
            @RequestBody RoadmapStepStatusRequest request
    ) {
        RoadmapResponseDTO roadmap = roadmapService.updateStepStatus(userPrincipal, planId, stepOrder, request.isCompleted());
        return ResponseEntity.ok(new ApiResponse<>("Step status updated", roadmap));
    }
}
