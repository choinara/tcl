package com.peakmate.backend.infra.repository.admin;

import com.peakmate.backend.domain.admin.entity.AdminUserRole;
import com.peakmate.backend.domain.admin.entity.QAdminRole;
import com.peakmate.backend.domain.admin.entity.QAdminUserRole;
import com.peakmate.backend.domain.admin.repository.AdminUserRoleRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class AdminUserRoleRepositoryImpl implements AdminUserRoleRepository {

    private final JPAQueryFactory queryFactory;
    private final AdminUserRoleJpaRepository adminUserRoleJpaRepository;

    @Override
    public List<String> findRoleCodesByAdminUserId(Long adminUserId) {
        QAdminUserRole userRole = QAdminUserRole.adminUserRole;
        QAdminRole role = QAdminRole.adminRole;

        return queryFactory
                .select(role.roleCode)
                .from(userRole)
                .join(role).on(userRole.adminRoleId.eq(role.id))
                .where(userRole.adminUserId.eq(adminUserId))
                .fetch();
    }

    @Override
    public List<Long> findRoleIdsByAdminUserId(Long adminUserId) {
        QAdminUserRole userRole = QAdminUserRole.adminUserRole;

        return queryFactory
                .select(userRole.adminRoleId)
                .from(userRole)
                .where(userRole.adminUserId.eq(adminUserId))
                .fetch();
    }

    @Override
    public void saveAll(Long adminUserId, List<Long> adminRoleIds) {
        List<AdminUserRole> userRoles = adminRoleIds.stream()
                .map(roleId -> AdminUserRole.of(adminUserId, roleId))
                .collect(Collectors.toList());
        adminUserRoleJpaRepository.saveAll(userRoles);
    }
}
