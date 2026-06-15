package com.peakmate.backend.interfaces.master.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.master.entity.MasterProduct;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.master.MasterProductJpaRepository;
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
@RequestMapping("/api/master/products")
@RequiredArgsConstructor
public class MasterProductController {

    private final MasterProductJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "MM0070", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<MasterProduct> all = repository.findAllByOrderByIdAsc();
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

    @RequirePermission(menu = "MM0070", action = "update")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String modelName = (String) row.getOrDefault("modelName", "");
                    String customerName = (String) row.getOrDefault("customerName", "");
                    if (modelName != null && !modelName.isBlank() && customerName != null && !customerName.isBlank()
                            && repository.findByModelNameAndCustomerName(modelName, customerName).isPresent()) {
                        throw new IllegalArgumentException("이미 존재하는 제품입니다: " + modelName + " / " + customerName);
                    }
                    MasterProduct entity = MasterProduct.create(
                            modelName,
                            (String) row.getOrDefault("rawMaterial", ""),
                            (String) row.getOrDefault("materialType", ""),
                            customerName,
                            (String) row.getOrDefault("platingThickness", ""),
                            (String) row.getOrDefault("productSpec", ""),
                            (String) row.getOrDefault("processRolling", "N"),
                            (String) row.getOrDefault("processPlating", "N"),
                            (String) row.getOrDefault("processHeatTreatment", "N"),
                            (String) row.getOrDefault("processSurfaceTreatment", "N"),
                            (String) row.getOrDefault("processPackaging", "N"),
                            (String) row.getOrDefault("thickness", ""),
                            (String) row.getOrDefault("width", ""),
                            row.get("unitConversion") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    MasterProduct entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("modelName", entity.getModelName()),
                            (String) row.getOrDefault("rawMaterial", entity.getRawMaterial()),
                            (String) row.getOrDefault("materialType", entity.getMaterialType()),
                            (String) row.getOrDefault("customerName", entity.getCustomerName()),
                            (String) row.getOrDefault("platingThickness", entity.getPlatingThickness()),
                            (String) row.getOrDefault("productSpec", entity.getProductSpec()),
                            (String) row.getOrDefault("processRolling", entity.getProcessRolling()),
                            (String) row.getOrDefault("processPlating", entity.getProcessPlating()),
                            (String) row.getOrDefault("processHeatTreatment", entity.getProcessHeatTreatment()),
                            (String) row.getOrDefault("processSurfaceTreatment", entity.getProcessSurfaceTreatment()),
                            (String) row.getOrDefault("processPackaging", entity.getProcessPackaging()),
                            (String) row.getOrDefault("thickness", entity.getThickness()),
                            (String) row.getOrDefault("width", entity.getWidth()),
                            row.get("unitConversion") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : entity.getUnitConversion(),
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
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "제품 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] MASTER batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "MM0070", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(MasterProduct e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("modelName", e.getModelName());
        map.put("rawMaterial", e.getRawMaterial());
        map.put("materialType", e.getMaterialType());
        map.put("customerName", e.getCustomerName());
        map.put("platingThickness", e.getPlatingThickness());
        map.put("productSpec", e.getProductSpec());
        map.put("processRolling", e.getProcessRolling());
        map.put("processPlating", e.getProcessPlating());
        map.put("processHeatTreatment", e.getProcessHeatTreatment());
        map.put("processSurfaceTreatment", e.getProcessSurfaceTreatment());
        map.put("processPackaging", e.getProcessPackaging());
        map.put("thickness", e.getThickness());
        map.put("width", e.getWidth());
        map.put("unitConversion", e.getUnitConversion());
        map.put("isActive", e.getIsActive());
        return map;
    }
}
