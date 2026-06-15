package com.peakmate.backend.domain.preference.service;

import com.peakmate.backend.domain.preference.entity.UserPreference;
import com.peakmate.backend.domain.preference.repository.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 사용자 환경설정 도메인 서비스.
 * 환경설정 조회 및 저장(upsert) 로직을 담당합니다.
 */
@Service
@RequiredArgsConstructor
public class UserPreferenceDomainService {

    private final UserPreferenceRepository userPreferenceRepository;

    /**
     * 관리자의 모든 환경설정을 key->value 맵으로 반환합니다.
     *
     * @param adminUserId 관리자 ID
     * @return 환경설정 key-value 맵
     */
    @Transactional(readOnly = true)
    public Map<String, String> getPreferences(Long adminUserId) {
        List<UserPreference> prefs = userPreferenceRepository.findByAdminUserId(adminUserId);
        Map<String, String> result = new LinkedHashMap<>();
        for (UserPreference pref : prefs) {
            result.put(pref.getPrefKey(), pref.getPrefValue());
        }
        return result;
    }

    /**
     * 관리자의 환경설정을 일괄 저장합니다.
     * - 값이 비어 있으면 해당 키의 항목을 삭제합니다.
     * - 기존 항목이 있으면 값을 업데이트하고, 없으면 새로 생성합니다.
     *
     * @param adminUserId 관리자 ID
     * @param prefs       저장할 key-value 맵
     */
    @Transactional
    public void savePreferences(Long adminUserId, Map<String, String> prefs) {
        for (Map.Entry<String, String> entry : prefs.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (!StringUtils.hasText(value)) {
                // 값이 비어 있으면 해당 항목 삭제
                userPreferenceRepository.deleteByAdminUserIdAndPrefKey(adminUserId, key);
            } else {
                Optional<UserPreference> existing =
                        userPreferenceRepository.findByAdminUserIdAndPrefKey(adminUserId, key);

                if (existing.isPresent()) {
                    existing.get().updateValue(value);
                    userPreferenceRepository.save(existing.get());
                } else {
                    userPreferenceRepository.save(UserPreference.of(adminUserId, key, value));
                }
            }
        }
    }
}
