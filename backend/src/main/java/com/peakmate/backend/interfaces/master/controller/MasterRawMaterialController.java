package com.peakmate.backend.interfaces.master.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.master.entity.MasterRawMaterial;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.master.MasterRawMaterialJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/master/raw-materials")
@RequiredArgsConstructor
public class MasterRawMaterialController {

    private final MasterRawMaterialJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "MM0060", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<MasterRawMaterial> all = repository.findAllByOrderByIdAsc();
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

    @RequirePermission(menu = "MM0060", action = "update")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String code = (String) row.getOrDefault("materialCode", "");
                    if (code != null && !code.isBlank() && repository.findByMaterialCode(code).isPresent()) {
                        throw new IllegalArgumentException("이미 존재하는 자재코드입니다: " + code);
                    }
                    MasterRawMaterial entity = MasterRawMaterial.create(
                            code,
                            (String) row.getOrDefault("materialType", ""),
                            (String) row.getOrDefault("modelName", ""),
                            (String) row.getOrDefault("supplierName", ""),
                            (String) row.getOrDefault("rawMaterial", ""),
                            (String) row.getOrDefault("productSpec", ""),
                            (String) row.getOrDefault("hardnessType", "")
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    MasterRawMaterial entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("materialCode", entity.getMaterialCode()),
                            (String) row.getOrDefault("materialType", entity.getMaterialType()),
                            (String) row.getOrDefault("modelName", entity.getModelName()),
                            (String) row.getOrDefault("supplierName", entity.getSupplierName()),
                            (String) row.getOrDefault("rawMaterial", entity.getRawMaterial()),
                            (String) row.getOrDefault("productSpec", entity.getProductSpec()),
                            (String) row.getOrDefault("hardnessType", entity.getHardnessType()),
                            (String) row.getOrDefault("isActive", entity.getIsActive())
                    );
                    repository.save(entity);
                }
                case "deleted" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    repository.deleteById(id);
                }
            }
        }
        int createdCount = (int) rows.stream().filter(r -> "created".equals(r.get("_rowState"))).count();
        int updatedCount = (int) rows.stream().filter(r -> "updated".equals(r.get("_rowState"))).count();
        int deletedCount = (int) rows.stream().filter(r -> "deleted".equals(r.get("_rowState"))).count();
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "원자재 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] MASTER batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "MM0060", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(MasterRawMaterial e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("materialCode", e.getMaterialCode());
        map.put("materialType", e.getMaterialType());
        map.put("modelName", e.getModelName());
        map.put("supplierName", e.getSupplierName());
        map.put("rawMaterial", e.getRawMaterial());
        map.put("productSpec", e.getProductSpec());
        map.put("hardnessType", e.getHardnessType());
        map.put("isActive", e.getIsActive());
        return map;
    }
}
