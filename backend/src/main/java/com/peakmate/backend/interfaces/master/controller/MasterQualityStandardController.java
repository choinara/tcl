package com.peakmate.backend.interfaces.master.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.master.entity.MasterQualityStandard;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.master.MasterQualityStandardJpaRepository;
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
@RequestMapping("/api/master/quality-standards")
@RequiredArgsConstructor
public class MasterQualityStandardController {

    private final MasterQualityStandardJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "MM0090", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<MasterQualityStandard> all = repository.findAllByOrderByIdAsc();
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

    @RequirePermission(menu = "MM0090", action = "update")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    MasterQualityStandard entity = MasterQualityStandard.create(
                            (String) row.getOrDefault("customerName", ""),
                            (String) row.getOrDefault("category", ""),
                            (String) row.getOrDefault("variety", ""),
                            (String) row.getOrDefault("surfaceTreatment", ""),
                            (String) row.getOrDefault("specThickness", ""),
                            (String) row.getOrDefault("specWidth", ""),
                            (String) row.getOrDefault("specBurr", ""),
                            (String) row.getOrDefault("specEdgeW", ""),
                            (String) row.getOrDefault("specEdgeT", ""),
                            (String) row.getOrDefault("specPlatingThickness", ""),
                            (String) row.getOrDefault("specPlatingAdhesion", ""),
                            (String) row.getOrDefault("specSaltSpray", ""),
                            (String) row.getOrDefault("specCrAmount", ""),
                            (String) row.getOrDefault("specAppearance", ""),
                            (String) row.getOrDefault("specSurfaceRoughness", ""),
                            (String) row.getOrDefault("specDeltaCr", ""),
                            (String) row.getOrDefault("specIcp", "")
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    MasterQualityStandard entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("customerName", entity.getCustomerName()),
                            (String) row.getOrDefault("category", entity.getCategory()),
                            (String) row.getOrDefault("variety", entity.getVariety()),
                            (String) row.getOrDefault("surfaceTreatment", entity.getSurfaceTreatment()),
                            (String) row.getOrDefault("specThickness", entity.getSpecThickness()),
                            (String) row.getOrDefault("specWidth", entity.getSpecWidth()),
                            (String) row.getOrDefault("specBurr", entity.getSpecBurr()),
                            (String) row.getOrDefault("specEdgeW", entity.getSpecEdgeW()),
                            (String) row.getOrDefault("specEdgeT", entity.getSpecEdgeT()),
                            (String) row.getOrDefault("specPlatingThickness", entity.getSpecPlatingThickness()),
                            (String) row.getOrDefault("specPlatingAdhesion", entity.getSpecPlatingAdhesion()),
                            (String) row.getOrDefault("specSaltSpray", entity.getSpecSaltSpray()),
                            (String) row.getOrDefault("specCrAmount", entity.getSpecCrAmount()),
                            (String) row.getOrDefault("specAppearance", entity.getSpecAppearance()),
                            (String) row.getOrDefault("specSurfaceRoughness", entity.getSpecSurfaceRoughness()),
                            (String) row.getOrDefault("specDeltaCr", entity.getSpecDeltaCr()),
                            (String) row.getOrDefault("specIcp", entity.getSpecIcp()),
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
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "품질기준 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] MASTER batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "MM0090", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(MasterQualityStandard e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("customerName", e.getCustomerName());
        map.put("category", e.getCategory());
        map.put("variety", e.getVariety());
        map.put("surfaceTreatment", e.getSurfaceTreatment());
        map.put("specThickness", e.getSpecThickness());
        map.put("specWidth", e.getSpecWidth());
        map.put("specBurr", e.getSpecBurr());
        map.put("specEdgeW", e.getSpecEdgeW());
        map.put("specEdgeT", e.getSpecEdgeT());
        map.put("specPlatingThickness", e.getSpecPlatingThickness());
        map.put("specPlatingAdhesion", e.getSpecPlatingAdhesion());
        map.put("specSaltSpray", e.getSpecSaltSpray());
        map.put("specCrAmount", e.getSpecCrAmount());
        map.put("specAppearance", e.getSpecAppearance());
        map.put("specSurfaceRoughness", e.getSpecSurfaceRoughness());
        map.put("specDeltaCr", e.getSpecDeltaCr());
        map.put("specIcp", e.getSpecIcp());
        map.put("isActive", e.getIsActive());
        return map;
    }
}
