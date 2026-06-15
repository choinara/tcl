package com.peakmate.backend.domain.admin.repository;

import com.peakmate.backend.domain.admin.entity.AdminRole;

import java.util.List;
import java.util.Optional;

/**
 * AdminRole Repository 인터페이스.
 */
public interface AdminRoleRepository {

    /**
     * 권한 코드로 권한 정보 조회
     */
    Optional<AdminRole> findByRoleCode(String roleCode);

    /**
     * 여러 권한 코드로 권한 정보 목록 조회
     */
    List<AdminRole> findAllByRoleCodeIn(List<String> codes);

    /**
     * 전체 역할 목록 조회 (정렬순서 기준)
     */
    List<AdminRole> findAll();

    /**
     * ID로 역할 조회
     */
    Optional<AdminRole> findById(Long id);

    /**
     * 역할 저장 (생성/수정)
     */
    AdminRole save(AdminRole adminRole);

    /**
     * 역할 삭제
     */
    void deleteById(Long id);
}
