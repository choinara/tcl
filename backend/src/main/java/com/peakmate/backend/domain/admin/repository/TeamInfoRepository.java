package com.peakmate.backend.domain.admin.repository;

import com.peakmate.backend.domain.admin.entity.TeamInfo;

import java.util.Optional;

/**
 * TeamInfo Repository 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface TeamInfoRepository {

    Optional<TeamInfo> findById(Long id);
}
