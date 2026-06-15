package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.admin.entity.AdminRole;
import com.peakmate.backend.domain.admin.service.AdminRoleDomainService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.system.dto.request.CreateRoleRequest;
import com.peakmate.backend.interfaces.system.dto.request.UpdateRoleRequest;
import com.peakmate.core.log.SystemLog;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 시스템 역할 관리 API Controller.
 * CRUD를 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/system/roles")
@RequiredArgsConstructor
public class SystemRoleController {

    private final AdminRoleDomainService adminRoleDomainService;

    /**
     * 전체 역할 목록 조회 (PeakDataGrid 호환 페이징 포맷)
     */
    @RequirePermission(menu = "SM0030", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<AdminRole> roles = adminRoleDomainService.findAll();
        List<Map<String, Object>> content = roles.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            content = content.stream()
                    .filter(m -> m.values().stream()
                            .anyMatch(v -> v != null && v.toString().toLowerCase().contains(kw)))
                    .collect(Collectors.toList());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        response.put("totalPages", 1);
        response.put("first", true);
        response.put("last", true);
        return ApiResponse.success(response);
    }

    /**
     * 역할 생성
     */
    @RequirePermission(menu = "SM0030", action = "create")
    @SystemLog(type = "ROLE_CHANGE", action = "역할 생성")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreateRoleRequest request) {
        AdminRole created = adminRoleDomainService.create(request.roleCode(), request.roleName(), request.description());

        return ApiResponse.success(toResponse(created));
    }

    /**
     * 역할 수정
     */
    @RequirePermission(menu = "SM0030", action = "update")
    @SystemLog(type = "ROLE_CHANGE", action = "역할 수정")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        AdminRole updated = adminRoleDomainService.update(id, request.roleCode(), request.roleName(), request.description());

        return ApiResponse.success(toResponse(updated));
    }

    /**
     * 역할 삭제
     */
    @RequirePermission(menu = "SM0030", action = "delete")
    @SystemLog(type = "ROLE_CHANGE", action = "역할 삭제")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        adminRoleDomainService.delete(id);

        return ApiResponse.success("역할이 삭제되었습니다.");
    }

    private Map<String, Object> toResponse(AdminRole role) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", role.getId());
        map.put("roleCode", role.getRoleCode());
        map.put("roleName", role.getName());
        map.put("description", role.getDescription());
        return map;
    }
}
