package com.peakmate.backend.domain.system.service;

import com.peakmate.backend.domain.system.entity.SystemSetting;
import com.peakmate.backend.domain.system.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    /**
     * 설정값 조회. 없으면 기본값 반환.
     */
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "systemSettings", key = "#key")
    public String getValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(s -> s.getSettingValue())
                .orElse(defaultValue);
    }

    /**
     * boolean 설정값 조회.
     */
    @Transactional(readOnly = true)
    public boolean getBooleanValue(String key, boolean defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(s -> "true".equalsIgnoreCase(s.getSettingValue()))
                .orElse(defaultValue);
    }

    /**
     * 설정값 업데이트.
     */
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "systemSettings", key = "#key")
    public void updateValue(String key, String value) {
        systemSettingRepository.findBySettingKey(key)
                .ifPresent(s -> s.updateValue(value));
    }

    /**
     * 설정값 Upsert (없으면 생성, 있으면 업데이트).
     */
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "systemSettings", key = "#key")
    public void upsertValue(String key, String value) {
        systemSettingRepository.findBySettingKey(key)
                .ifPresentOrElse(
                        s -> s.updateValue(value),
                        () -> systemSettingRepository.save(SystemSetting.create(key, value, null))
                );
    }

    /**
     * 다중로그인 제한 여부 (true: 1인 1세션, false: 다중 허용)
     */
    public boolean isSingleLoginEnabled() {
        return getBooleanValue("security.single-login", true);
    }
}
