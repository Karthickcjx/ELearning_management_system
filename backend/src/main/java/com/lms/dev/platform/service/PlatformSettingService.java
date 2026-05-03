package com.lms.dev.platform.service;

import com.lms.dev.platform.dto.PlatformSettingsResponse;
import com.lms.dev.platform.entity.PlatformSetting;
import com.lms.dev.platform.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PlatformSettingService {

    private final PlatformSettingRepository settingRepository;

    public PlatformSettingsResponse getAllSettings() {
        List<PlatformSetting> all = settingRepository.findAll();
        Map<String, String> map = new LinkedHashMap<>();
        for (PlatformSetting s : all) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return new PlatformSettingsResponse(map);
    }

    @Transactional
    public PlatformSettingsResponse updateSettings(Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            Optional<PlatformSetting> existing = settingRepository.findBySettingKey(entry.getKey());
            if (existing.isPresent()) {
                PlatformSetting setting = existing.get();
                setting.setSettingValue(entry.getValue());
                settingRepository.save(setting);
            } else {
                PlatformSetting newSetting = new PlatformSetting();
                newSetting.setSettingKey(entry.getKey());
                newSetting.setSettingValue(entry.getValue());
                settingRepository.save(newSetting);
            }
        }
        return getAllSettings();
    }

    public String getSetting(String key) {
        return settingRepository.findBySettingKey(key)
                .map(PlatformSetting::getSettingValue)
                .orElse(null);
    }
}
