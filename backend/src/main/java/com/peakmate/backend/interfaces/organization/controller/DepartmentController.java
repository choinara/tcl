package com.peakmate.backend.interfaces.organization.controller;

import com.peakmate.backend.domain.organization.entity.Department;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.organization.dto.request.CreateDepartmentRequest;
import com.peakmate.backend.interfaces.organization.dto.request.UpdateDepartmentRequest;
import com.peakmate.backend.infra.repository.organization.DepartmentJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organization/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentJpaRepository departmentJpaRepository;

    @RequirePermission(menu = "UM0020", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<Department> all = departmentJpaRepository.findAllByOrderBySortOrderAsc();
        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

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

    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> findAllActive() {
        List<Department> all = departmentJpaRepository.findByIsActiveOrderBySortOrderAsc("Y");
        return ApiResponse.success(all.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "UM0020", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreateDepartmentRequest request) {
        if (departmentJpaRepository.findByDeptCode(request.deptCode()).isPresent()) {
            return ApiResponse.error("DEPT002", "이미 사용중인 부서코드입니다.");
        }

        Department dept = Department.create(
                request.deptCode(),
                request.deptName(),
                request.companyId(),
                request.parentId(),
                request.deptLevel() != null ? request.deptLevel() : 1,
                request.sortOrder() != null ? request.sortOrder() : 0,
                request.managerName(),
                request.phone(),
                request.location()
        );
        Department saved = departmentJpaRepository.save(dept);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "UM0020", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @Valid @RequestBody UpdateDepartmentRequest request) {
        Department dept = departmentJpaRepository.findById(id).orElse(null);
        if (dept == null) return ApiResponse.error("DEPT001", "부서를 찾을 수 없습니다.");

        dept.update(
                request.deptName() != null ? request.deptName() : dept.getDeptName(),
                request.companyId() != null ? request.companyId() : dept.getCompanyId(),
                request.parentId() != null ? request.parentId() : dept.getParentId(),
                request.deptLevel() != null ? request.deptLevel() : dept.getDeptLevel(),
                request.sortOrder() != null ? request.sortOrder() : dept.getSortOrder(),
                request.managerName() != null ? request.managerName() : dept.getManagerName(),
                request.phone() != null ? request.phone() : dept.getPhone(),
                request.location() != null ? request.location() : dept.getLocation(),
                request.isActive() != null ? (request.isActive() ? "Y" : "N") : dept.getIsActive()
        );
        Department saved = departmentJpaRepository.save(dept);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "UM0020", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        departmentJpaRepository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(Department d) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", d.getId());
        map.put("deptCode", d.getDeptCode());
        map.put("deptName", d.getDeptName());
        map.put("companyId", d.getCompanyId());
        map.put("parentId", d.getParentId());
        map.put("deptLevel", d.getDeptLevel());
        map.put("sortOrder", d.getSortOrder());
        map.put("managerName", d.getManagerName());
        map.put("phone", d.getPhone());
        map.put("location", d.getLocation());
        map.put("isActive", "Y".equals(d.getIsActive()));
        return map;
    }
}
