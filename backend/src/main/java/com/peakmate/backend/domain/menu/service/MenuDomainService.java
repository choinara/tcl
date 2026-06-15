package com.peakmate.backend.domain.menu.service;

import com.peakmate.backend.application.menu.dto.result.MenuTreeNode;
import com.peakmate.backend.domain.menu.entity.MenuRolePermission;
import com.peakmate.backend.domain.menu.entity.SystemMenu;
import com.peakmate.backend.domain.menu.entity.UserPermission;
import com.peakmate.backend.domain.menu.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 메뉴 도메인 서비스.
 * 역할 기반 메뉴 트리 구성 + 사용자별 예외권한 오버라이드를 담당합니다.
 * OrbitMES의 MenuPermissionService와 동일한 패턴을 사용합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuDomainService {

    private final MenuRepository menuRepository;

    /**
     * 주어진 역할 ID 목록 + 사용자 ID에 대한 메뉴 트리를 조회합니다.
     * SUPER_ADMIN은 비활성(useYn='N') 메뉴 포함 전체 메뉴에 전권 부여합니다.
     *
     * <p>처리 순서:
     * <ol>
     *   <li>SUPER_ADMIN: 전체 메뉴(비활성 포함) + PermissionSet.ALL → 즉시 트리 빌드</li>
     *   <li>일반: useYn='Y'인 메뉴 조회 → 역할 기반 권한 OR 병합 → 사용자별 예외권한 오버라이드</li>
     *   <li>childrenMap 구성 후 재귀적으로 트리 빌드</li>
     *   <li>canRead=true인 메뉴만 포함하여 반환</li>
     * </ol>
     */
    @Transactional(readOnly = true)
    public List<MenuTreeNode> getMenuTreeForRoles(List<Long> roleIds, Long userId, boolean isSuperAdmin) {
        List<SystemMenu> allMenus;
        Map<Long, PermissionSet> permissionMap = new HashMap<>();

        if (isSuperAdmin) {
            // 비활성 메뉴 포함 전체 조회, 모든 메뉴에 전권 부여
            allMenus = menuRepository.findAllMenus();
            for (SystemMenu menu : allMenus) {
                permissionMap.put(menu.getId(), PermissionSet.ALL);
            }
        } else {
            // 1. useYn='Y'인 전체 메뉴 조회 (sortOrder 오름차순)
            allMenus = menuRepository.findAll();

            // 2. 역할 기반 권한 조회 + OR 병합
            List<MenuRolePermission> rolePermissions = menuRepository.findPermissionsByRoleIds(roleIds);
            permissionMap = mergeRolePermissions(rolePermissions);

            // 3. 사용자별 예외권한 오버라이드 (OrbitMES 패턴: 역할 권한을 완전히 대체)
            if (userId != null) {
                List<UserPermission> userPermissions = menuRepository.findUserPermissionsByUserId(userId);
                for (UserPermission up : userPermissions) {
                    permissionMap.put(up.getMenuId(), new PermissionSet(
                            "Y".equals(up.getCanRead()),
                            "Y".equals(up.getCanCreate()),
                            "Y".equals(up.getCanUpdate()),
                            "Y".equals(up.getCanDelete()),
                            "Y".equals(up.getCanExport()),
                            "Y".equals(up.getCanViewPii()),
                            "Y".equals(up.getCanApprove())
                    ));
                }
            }
        }

        log.info("[MenuTree] superAdmin={}, allMenus={}, finalPermMap={}",
                isSuperAdmin, allMenus.size(), permissionMap.size());

        // 4. childrenMap 구성
        Map<Long, List<SystemMenu>> childrenMap = new HashMap<>();
        List<SystemMenu> roots = new ArrayList<>();

        for (SystemMenu menu : allMenus) {
            if (menu.getParentId() == null) {
                roots.add(menu);
            } else {
                childrenMap.computeIfAbsent(menu.getParentId(), k -> new ArrayList<>()).add(menu);
            }
        }

        // 5. 재귀적 트리 빌드
        List<MenuTreeNode> tree = new ArrayList<>();
        for (SystemMenu root : roots) {
            MenuTreeNode node = buildPermissionTreeNode(root, childrenMap, permissionMap);
            if (node != null) {
                tree.add(node);
            }
        }

        return tree;
    }

    /**
     * 특정 사용자의 특정 메뉴에 대한 최종 권한을 조회합니다.
     * PermissionCheckAspect에서 사용합니다.
     *
     * @param roleIds  사용자의 역할 ID 목록
     * @param userId   사용자 ID
     * @param menuId   메뉴 ID
     * @return 병합된 최종 권한
     */
    @Transactional(readOnly = true)
    public PermissionSet getUserPermissionForMenu(List<Long> roleIds, Long userId, Long menuId) {
        // 1. 역할 기반 권한 병합
        List<MenuRolePermission> rolePermissions = menuRepository.findPermissionsByRoleIds(roleIds);
        PermissionSet merged = PermissionSet.NONE;
        for (MenuRolePermission rp : rolePermissions) {
            if (rp.getMenuId().equals(menuId)) {
                merged = merged.merge(
                        "Y".equals(rp.getCanRead()),
                        "Y".equals(rp.getCanCreate()),
                        "Y".equals(rp.getCanUpdate()),
                        "Y".equals(rp.getCanDelete()),
                        "Y".equals(rp.getCanExport()),
                        "Y".equals(rp.getCanViewPii()),
                        "Y".equals(rp.getCanApprove())
                );
            }
        }

        // 2. 사용자별 예외권한 오버라이드 (있으면 역할 권한을 완전히 대체)
        List<UserPermission> userPermissions = menuRepository.findUserPermissionsByUserId(userId);
        for (UserPermission up : userPermissions) {
            if (up.getMenuId().equals(menuId)) {
                return new PermissionSet(
                        "Y".equals(up.getCanRead()),
                        "Y".equals(up.getCanCreate()),
                        "Y".equals(up.getCanUpdate()),
                        "Y".equals(up.getCanDelete()),
                        "Y".equals(up.getCanExport()),
                        "Y".equals(up.getCanViewPii()),
                        "Y".equals(up.getCanApprove())
                );
            }
        }

        return merged;
    }

    private MenuTreeNode buildPermissionTreeNode(
            SystemMenu menu,
            Map<Long, List<SystemMenu>> childrenMap,
            Map<Long, PermissionSet> permissionMap
    ) {
        List<SystemMenu> children = childrenMap.getOrDefault(menu.getId(), List.of());
        PermissionSet perm = permissionMap.getOrDefault(menu.getId(), PermissionSet.NONE);

        if (children.isEmpty()) {
            if (!perm.canRead) {
                return null;
            }
            return new MenuTreeNode(
                    menu.getId(), menu.getMenuCode(), menu.getMenuName(), menu.getMenuPath(),
                    menu.getIcon(), menu.getSortOrder(),
                    perm.canRead, perm.canCreate, perm.canUpdate, perm.canDelete, perm.canExport,
                    perm.canViewPii, perm.canApprove, List.of()
            );
        }

        List<MenuTreeNode> childNodes = new ArrayList<>();
        for (SystemMenu child : children) {
            MenuTreeNode childNode = buildPermissionTreeNode(child, childrenMap, permissionMap);
            if (childNode != null) {
                childNodes.add(childNode);
            }
        }

        if (childNodes.isEmpty() && !perm.canRead) {
            return null;
        }

        return new MenuTreeNode(
                menu.getId(), menu.getMenuCode(), menu.getMenuName(), menu.getMenuPath(),
                menu.getIcon(), menu.getSortOrder(),
                perm.canRead, perm.canCreate, perm.canUpdate, perm.canDelete, perm.canExport,
                perm.canViewPii, perm.canApprove, childNodes
        );
    }

    private Map<Long, PermissionSet> mergeRolePermissions(List<MenuRolePermission> permissions) {
        Map<Long, PermissionSet> map = new HashMap<>();
        for (MenuRolePermission perm : permissions) {
            PermissionSet existing = map.getOrDefault(perm.getMenuId(), PermissionSet.NONE);
            map.put(perm.getMenuId(), existing.merge(
                    "Y".equals(perm.getCanRead()),
                    "Y".equals(perm.getCanCreate()),
                    "Y".equals(perm.getCanUpdate()),
                    "Y".equals(perm.getCanDelete()),
                    "Y".equals(perm.getCanExport()),
                    "Y".equals(perm.getCanViewPii()),
                    "Y".equals(perm.getCanApprove())
            ));
        }
        return map;
    }

    /**
     * 불변 권한 세트 (OrbitMES PermissionSet 패턴).
     */
    public static final class PermissionSet {
        public static final PermissionSet NONE = new PermissionSet(false, false, false, false, false, false, false);
        public static final PermissionSet ALL  = new PermissionSet(true,  true,  true,  true,  true,  true,  true);

        public final boolean canRead;
        public final boolean canCreate;
        public final boolean canUpdate;
        public final boolean canDelete;
        public final boolean canExport;
        public final boolean canViewPii;
        public final boolean canApprove;

        public PermissionSet(boolean canRead, boolean canCreate, boolean canUpdate,
                             boolean canDelete, boolean canExport, boolean canViewPii,
                             boolean canApprove) {
            this.canRead = canRead;
            this.canCreate = canCreate;
            this.canUpdate = canUpdate;
            this.canDelete = canDelete;
            this.canExport = canExport;
            this.canViewPii = canViewPii;
            this.canApprove = canApprove;
        }

        public PermissionSet merge(boolean read, boolean create, boolean update,
                                   boolean delete, boolean export, boolean viewPii,
                                   boolean approve) {
            return new PermissionSet(
                    this.canRead || read,
                    this.canCreate || create,
                    this.canUpdate || update,
                    this.canDelete || delete,
                    this.canExport || export,
                    this.canViewPii || viewPii,
                    this.canApprove || approve
            );
        }

        public boolean hasAction(String action) {
            return switch (action) {
                case "read" -> canRead;
                case "create" -> canCreate;
                case "update" -> canUpdate;
                case "delete" -> canDelete;
                case "export" -> canExport;
                case "viewPii" -> canViewPii;
                case "approve" -> canApprove;
                default -> false;
            };
        }
    }
}
