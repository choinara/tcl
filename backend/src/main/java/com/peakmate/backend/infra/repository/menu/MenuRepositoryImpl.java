package com.peakmate.backend.infra.repository.menu;

import com.peakmate.backend.domain.menu.entity.MenuRolePermission;
import com.peakmate.backend.domain.menu.entity.QMenuRolePermission;
import com.peakmate.backend.domain.menu.entity.SystemMenu;
import com.peakmate.backend.domain.menu.entity.UserPermission;
import com.peakmate.backend.domain.menu.repository.MenuRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * MenuRepository 구현체.
 * 단순 조회는 JPA Repository를 위임하고, 복잡한 조회는 QueryDSL을 사용합니다.
 */
@Repository
@RequiredArgsConstructor
public class MenuRepositoryImpl implements MenuRepository {

    private final SystemMenuJpaRepository systemMenuJpaRepository;
    private final UserPermissionJpaRepository userPermissionJpaRepository;
    private final JPAQueryFactory queryFactory;

    @Override
    public List<SystemMenu> findAll() {
        return systemMenuJpaRepository.findByUseYnOrderBySortOrderAsc("Y");
    }

    @Override
    public List<SystemMenu> findAllMenus() {
        return systemMenuJpaRepository.findAllByOrderBySortOrderAsc();
    }

    @Override
    public Optional<SystemMenu> findById(Long id) {
        return systemMenuJpaRepository.findById(id);
    }

    @Override
    public SystemMenu save(SystemMenu menu) {
        return systemMenuJpaRepository.save(menu);
    }

    @Override
    public void deleteById(Long id) {
        systemMenuJpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByParentId(Long parentId) {
        return systemMenuJpaRepository.existsByParentId(parentId);
    }

    @Override
    public List<MenuRolePermission> findPermissionsByRoleIds(List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            return List.of();
        }

        QMenuRolePermission permission = QMenuRolePermission.menuRolePermission;

        return queryFactory
                .selectFrom(permission)
                .where(permission.adminRoleId.in(roleIds))
                .fetch();
    }

    @Override
    public List<UserPermission> findUserPermissionsByUserId(Long adminUserId) {
        return userPermissionJpaRepository.findByAdminUserId(adminUserId);
    }

    @Override
    public void deleteUserPermissionsByUserId(Long adminUserId) {
        userPermissionJpaRepository.deleteByAdminUserId(adminUserId);
    }

    @Override
    public UserPermission saveUserPermission(UserPermission userPermission) {
        return userPermissionJpaRepository.save(userPermission);
    }
}
