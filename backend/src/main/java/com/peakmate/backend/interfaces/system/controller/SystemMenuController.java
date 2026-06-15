package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.i18n.entity.I18nMessage;
import com.peakmate.backend.domain.menu.entity.SystemMenu;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.system.dto.request.CreateMenuRequest;
import com.peakmate.backend.interfaces.system.dto.request.UpdateMenuRequest;
import com.peakmate.backend.domain.menu.entity.MenuRolePermission;
import com.peakmate.backend.infra.repository.admin.AdminRoleJpaRepository;
import com.peakmate.backend.infra.repository.i18n.I18nMessageJpaRepository;
import com.peakmate.backend.infra.repository.menu.MenuRolePermissionJpaRepository;
import com.peakmate.backend.infra.repository.menu.SystemMenuJpaRepository;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 시스템 메뉴 관리 CRUD API Controller.
 * 관리자가 메뉴를 조회/등록/수정/삭제합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/system/menus")
@RequiredArgsConstructor
public class SystemMenuController {

    private final SystemMenuJpaRepository systemMenuJpaRepository;
    private final MenuRolePermissionJpaRepository menuRolePermissionJpaRepository;
    private final AdminRoleJpaRepository adminRoleJpaRepository;
    private final I18nMessageJpaRepository i18nMessageJpaRepository;

    /**
     * 전체 메뉴를 트리 구조로 반환합니다.
     */
    @RequirePermission(menu = "SM0010", action = "read")
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getAllMenus() {
        List<SystemMenu> all = systemMenuJpaRepository.findAllByOrderBySortOrderAsc();
        List<Map<String, Object>> tree = buildTree(all);
        return ApiResponse.success(tree);
    }

    /**
     * 메뉴 목록 조회 (메뉴권한관리 전용).
     * 메뉴권한관리(SM0020)에서 트리를 구성할 때 사용합니다.
     */
    @RequirePermission(menu = "SM0020", action = "read")
    @GetMapping("/list")
    public ApiResponse<List<Map<String, Object>>> getMenuListForAuth() {
        List<SystemMenu> all = systemMenuJpaRepository.findAllByOrderBySortOrderAsc();
        List<Map<String, Object>> tree = buildTree(all);
        return ApiResponse.success(tree);
    }

    /**
     * 메뉴 등록
     */
    @RequirePermission(menu = "SM0010", action = "create")
    @SystemLog(type = "MENU_CHANGE", action = "메뉴 생성", detail = "'메뉴 생성: ' + #request.menuCode() + ' ' + #request.menuName()")
    @PostMapping
    @Transactional
    public ApiResponse<Map<String, Object>> createMenu(@Valid @RequestBody CreateMenuRequest request) {
        if (systemMenuJpaRepository.findByMenuCode(request.menuCode()).isPresent()) {
            return ApiResponse.error("MENU002", "이미 사용중인 메뉴코드입니다.");
        }

        Long parentId = request.parentId();
        Integer sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;
        Boolean visible = request.visible() != null ? request.visible() : true;

        SystemMenu menu = SystemMenu.builder()
                .menuCode(request.menuCode())
                .menuName(request.menuName())
                .menuPath(request.menuPath() != null ? request.menuPath() : "")
                .parentId(parentId)
                .sortOrder(sortOrder)
                .icon(request.icon() != null ? request.icon() : "")
                .useYn(Boolean.TRUE.equals(visible) ? "Y" : "N")
                .menuLevel(parentId == null ? 1 : 2)
                .build();

        SystemMenu saved = systemMenuJpaRepository.save(menu);
        grantDefaultPermissions(saved.getId());

        return ApiResponse.success(toMap(saved));
    }

    /**
     * 메뉴 수정
     */
    @RequirePermission(menu = "SM0010", action = "update")
    @SystemLog(type = "MENU_CHANGE", action = "메뉴 수정", detail = "'메뉴 수정: ' + #request.menuCode()")
    @PutMapping("/{id}")
    @Transactional
    public ApiResponse<Map<String, Object>> updateMenu(@PathVariable Long id, @Valid @RequestBody UpdateMenuRequest request) {
        SystemMenu menu = systemMenuJpaRepository.findById(id).orElse(null);
        if (menu == null) {
            return ApiResponse.error("MENU001", "메뉴를 찾을 수 없습니다.");
        }

        String menuCode = request.menuCode() != null ? request.menuCode() : menu.getMenuCode();
        String menuName = request.menuName() != null ? request.menuName() : menu.getMenuName();

        if (!menuCode.equals(menu.getMenuCode()) && systemMenuJpaRepository.findByMenuCode(menuCode).isPresent()) {
            return ApiResponse.error("MENU002", "이미 사용중인 메뉴코드입니다.");
        }

        String menuPath = request.menuPath() != null ? request.menuPath() : menu.getMenuPath();
        Long parentId = request.parentId() != null ? request.parentId() : menu.getParentId();
        Integer sortOrder = request.sortOrder() != null ? request.sortOrder() : menu.getSortOrder();
        String icon = request.icon() != null ? request.icon() : menu.getIcon();
        Boolean visible = request.visible() != null ? request.visible() : "Y".equals(menu.getUseYn());

        String oldMenuName = menu.getMenuName();
        menu.update(menuCode, menuName, menuPath, parentId, sortOrder, icon,
                Boolean.TRUE.equals(visible) ? "Y" : "N");

        SystemMenu saved = systemMenuJpaRepository.save(menu);

        // menuName이 변경된 경우 ko i18n_message도 동기화 (사이드바/탭/타이틀 즉시 반영)
        if (!menuName.equals(oldMenuName)) {
            String i18nKey = "menu." + menuCode;
            i18nMessageJpaRepository.findByLangCodeAndMessageKey("ko", i18nKey)
                    .ifPresentOrElse(
                            msg -> {
                                msg.updateValue(menuName);
                                i18nMessageJpaRepository.save(msg);
                            },
                            () -> i18nMessageJpaRepository.save(I18nMessage.create("ko", i18nKey, menuName))
                    );
        }

        return ApiResponse.success(toMap(saved));
    }

    /**
     * 메뉴 삭제
     */
    @RequirePermission(menu = "SM0010", action = "delete")
    @SystemLog(type = "MENU_CHANGE", action = "메뉴 삭제", detail = "'메뉴 삭제: id=' + #id")
    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> deleteMenu(@PathVariable Long id) {
        if (systemMenuJpaRepository.existsByParentId(id)) {
            return ApiResponse.error("MENU002", "하위 메뉴가 존재합니다. 하위 메뉴를 먼저 삭제하세요.");
        }

        // 관련 권한 레코드를 먼저 삭제 (FK 제약 해소)
        menuRolePermissionJpaRepository.deleteByMenuId(id);
        menuRolePermissionJpaRepository.flush();
        systemMenuJpaRepository.deleteById(id);

        return ApiResponse.success("삭제되었습니다");
    }

    /**
     * 신규 메뉴에 SUPER_ADMIN, ADMIN 역할의 전체 권한을 자동 부여한다.
     * @Transactional 범위 내에서 호출되므로 실패 시 메뉴 생성도 함께 롤백된다.
     */
    private void grantDefaultPermissions(Long menuId) {
        List<String> defaultRoleCodes = List.of("SUPER_ADMIN", "ADMIN");
        for (String roleCode : defaultRoleCodes) {
            adminRoleJpaRepository.findByRoleCode(roleCode).ifPresent(role -> {
                String canViewPii = "SUPER_ADMIN".equals(roleCode) ? "Y" : "N";
                MenuRolePermission permission = MenuRolePermission.create(
                        menuId, role.getId(),
                        "Y", "Y", "Y", "Y", "Y", canViewPii, "N"
                );
                menuRolePermissionJpaRepository.save(permission);
            });
        }
    }

    private Map<String, Object> toMap(SystemMenu m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("menuCode", m.getMenuCode());
        map.put("menuName", m.getMenuName());
        map.put("menuPath", m.getMenuPath());
        map.put("parentId", m.getParentId());
        map.put("sortOrder", m.getSortOrder());
        map.put("icon", m.getIcon());
        map.put("visible", "Y".equals(m.getUseYn()));
        return map;
    }

    private List<Map<String, Object>> buildTree(List<SystemMenu> menus) {
        Map<Long, Map<String, Object>> nodeMap = new LinkedHashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();

        for (SystemMenu m : menus) {
            Map<String, Object> node = toMap(m);
            node.put("children", new ArrayList<>());
            nodeMap.put(m.getId(), node);
        }

        for (SystemMenu m : menus) {
            Map<String, Object> node = nodeMap.get(m.getId());
            if (m.getParentId() != null && nodeMap.containsKey(m.getParentId())) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) nodeMap.get(m.getParentId()).get("children");
                children.add(node);
            } else {
                roots.add(node);
            }
        }

        return roots;
    }
}
