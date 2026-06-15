package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.admin.entity.AdminRole;
import com.peakmate.backend.domain.admin.repository.AdminRoleRepository;
import com.peakmate.backend.infra.repository.menu.MenuRolePermissionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * AdminRole 도메인 서비스.
 * 역할(Role) CRUD 비즈니스 로직을 담당합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminRoleDomainService {

    private final AdminRoleRepository adminRoleRepository;
    private final MenuRolePermissionJpaRepository menuRolePermissionJpaRepository;

    /**
     * 전체 역할 목록 조회
     */
    public List<AdminRole> findAll() {
        return adminRoleRepository.findAll();
    }

    /**
     * ID로 역할 조회
     */
    public AdminRole findById(Long id) {
        return adminRoleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("역할을 찾을 수 없습니다. id=" + id));
    }

    /**
     * 역할 생성
     */
    @Transactional
    public AdminRole create(String roleCode, String roleName, String description) {
        adminRoleRepository.findByRoleCode(roleCode).ifPresent(r -> {
            throw new IllegalArgumentException("이미 존재하는 역할코드입니다: " + roleCode);
        });
        AdminRole role = AdminRole.create(roleCode, roleName, description);
        return adminRoleRepository.save(role);
    }

    /**
     * 역할 수정
     */
    @Transactional
    public AdminRole update(Long id, String roleCode, String name, String description) {
        AdminRole role = findById(id);
        // 역할코드 변경 시 중복 체크
        if (!role.getRoleCode().equals(roleCode)) {
            adminRoleRepository.findByRoleCode(roleCode).ifPresent(r -> {
                throw new IllegalArgumentException("이미 존재하는 역할코드입니다: " + roleCode);
            });
        }
        role.updateInfo(roleCode, name, description);
        return adminRoleRepository.save(role);
    }

    /**
     * 역할명 변경
     */
    @Transactional
    public AdminRole updateName(Long id, String name) {
        AdminRole role = findById(id);
        role.updateName(name);
        return adminRoleRepository.save(role);
    }

    /**
     * 역할 삭제
     */
    @Transactional
    public void delete(Long id) {
        findById(id);
        menuRolePermissionJpaRepository.deleteByAdminRoleId(id);
        adminRoleRepository.deleteById(id);
    }
}
