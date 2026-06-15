package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.admin.entity.AdminRole;
import com.peakmate.backend.domain.admin.repository.AdminRoleRepository;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 관리자 권한 관련 도메인 로직을 담당하는 서비스.
 */
@Service
@RequiredArgsConstructor
public class AdminUserRoleDomainService {

    private final AdminRoleRepository adminRoleRepository;
    private final AdminUserRoleRepository adminUserRoleRepository;

    /**
     * 사용자에게 권한을 부여합니다.
     */
    @Transactional
    public void assignRoles(Long userId, List<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return;
        }

        List<AdminRole> roles = adminRoleRepository.findAllByRoleCodeIn(roleCodes);
        List<Long> roleIds = roles.stream()
                .map(AdminRole::getId)
                .collect(Collectors.toList());

        adminUserRoleRepository.saveAll(userId, roleIds);
    }
}
