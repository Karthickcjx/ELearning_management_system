package com.lms.dev.platform.controller;

import com.lms.dev.common.dto.ApiResponse;
import com.lms.dev.platform.dto.PlatformSettingsRequest;
import com.lms.dev.platform.dto.PlatformSettingsResponse;
import com.lms.dev.platform.service.PlatformSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class PlatformSettingController {

    private final PlatformSettingService settingService;

    /**
     * Get all platform settings.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<PlatformSettingsResponse>> getAllSettings() {
        PlatformSettingsResponse response = settingService.getAllSettings();
        return ResponseEntity.ok(new ApiResponse<>("Settings retrieved", response));
    }

    /**
     * Update platform settings (bulk upsert).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    public ResponseEntity<ApiResponse<PlatformSettingsResponse>> updateSettings(
            @RequestBody PlatformSettingsRequest request) {
        PlatformSettingsResponse response = settingService.updateSettings(request.getSettings());
        return ResponseEntity.ok(new ApiResponse<>("Settings updated successfully", response));
    }
}
