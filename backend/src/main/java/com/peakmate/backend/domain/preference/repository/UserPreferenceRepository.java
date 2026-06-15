package com.peakmate.backend.domain.preference.repository;

import com.peakmate.backend.domain.preference.entity.UserPreference;

import java.util.List;
import java.util.Optional;

/**
 * UserPreference Repository 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface UserPreferenceRepository {

    /**
     * 관리자 ID로 모든 환경설정 항목을 조회합니다.
     */
    List<UserPreference> findByAdminUserId(Long adminUserId);

    /**
     * 관리자 ID와 키로 단일 환경설정 항목을 조회합니다.
     */
    Optional<UserPreference> findByAdminUserIdAndPrefKey(Long adminUserId, String prefKey);

    /**
     * 환경설정 항목을 저장합니다 (신규 또는 업데이트).
     */
    UserPreference save(UserPreference entity);

    /**
     * 관리자 ID와 키에 해당하는 환경설정 항목을 삭제합니다.
     */
    void deleteByAdminUserIdAndPrefKey(Long adminUserId, String prefKey);
}
