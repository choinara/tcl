package com.peakmate.backend.application.menu.dto.result;

import java.util.List;

/**
 * 메뉴 트리 노드 DTO.
 * 역할별 권한이 병합된 메뉴 트리 구조를 표현합니다.
 */
public record MenuTreeNode(
        long id,
        String menuCode,
        String menuName,
        String menuPath,
        String icon,
        int sortOrder,
        boolean canRead,
        boolean canCreate,
        boolean canUpdate,
        boolean canDelete,
        boolean canExport,
        boolean canViewPii,
        boolean canApprove,
        List<MenuTreeNode> children
) {}
