package com.peakmate.backend.interfaces.master.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.master.entity.MasterProductionRate;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.master.MasterProductionRateJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/master/production-rates")
@RequiredArgsConstructor
public class MasterProductionRateController {

    private final MasterProductionRateJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "MM0080", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<MasterProductionRate> all = repository.findAllByOrderByIdAsc();
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

    @RequirePermission(menu = "MM0080", action = "update")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    MasterProductionRate entity = MasterProductionRate.create(
                            (String) row.getOrDefault("rawMaterial", ""),
                            (String) row.getOrDefault("modelName", ""),
                            (String) row.getOrDefault("productSpec", ""),
                            (String) row.getOrDefault("materialType", ""),
                            (String) row.getOrDefault("customerName", ""),
                            row.get("unitConversion") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null,
                            row.get("rate4m") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null,
                            row.get("rate6m") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null,
                            row.get("rate8m") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    MasterProductionRate entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("rawMaterial", entity.getRawMaterial()),
                            (String) row.getOrDefault("modelName", entity.getModelName()),
                            (String) row.getOrDefault("productSpec", entity.getProductSpec()),
                            (String) row.getOrDefault("materialType", entity.getMaterialType()),
                            (String) row.getOrDefault("customerName", entity.getCustomerName()),
                            row.get("unitConversion") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : entity.getUnitConversion(),
                            row.get("rate4m") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : entity.getRate4m(),
                            row.get("rate6m") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : entity.getRate6m(),
                            row.get("rate8m") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : entity.getRate8m(),
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
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "생산율 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] MASTER batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "MM0080", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(MasterProductionRate e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("rawMaterial", e.getRawMaterial());
        map.put("modelName", e.getModelName());
        map.put("productSpec", e.getProductSpec());
        map.put("materialType", e.getMaterialType());
        map.put("customerName", e.getCustomerName());
        map.put("unitConversion", e.getUnitConversion());
        map.put("rate4m", e.getRate4m());
        map.put("rate6m", e.getRate6m());
        map.put("rate8m", e.getRate8m());
        map.put("isActive", e.getIsActive());
        return map;
    }
}
