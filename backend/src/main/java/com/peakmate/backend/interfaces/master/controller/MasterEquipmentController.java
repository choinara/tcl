package com.peakmate.backend.interfaces.master.controller;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.master.entity.MasterEquipment;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.master.MasterEquipmentJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/master/equipments")
@RequiredArgsConstructor
public class MasterEquipmentController {

    private final MasterEquipmentJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "MM0050", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size,
            @RequestParam(required = false) String keyword) {
        List<MasterEquipment> all = repository.findAllByOrderByIdAsc();
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

    @RequirePermission(menu = "MM0050", action = "update")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String unitNumber = (String) row.getOrDefault("unitNumber", "");
                    String lineName = (String) row.getOrDefault("lineName", "");
                    if (unitNumber != null && !unitNumber.isBlank() && lineName != null && !lineName.isBlank()
                            && repository.findByUnitNumberAndLineName(unitNumber, lineName).isPresent()) {
                        throw new IllegalArgumentException("이미 존재하는 설비입니다: " + unitNumber + " / " + lineName);
                    }
                    String equipCode = (String) row.get("equipCode");
                    if (equipCode != null && !equipCode.isBlank() && repository.findByEquipCode(equipCode).isPresent()) {
                        throw new IllegalArgumentException("이미 존재하는 설비코드입니다: " + equipCode);
                    }
                    MasterEquipment entity = MasterEquipment.create(
                            (String) row.getOrDefault("category", ""),
                            unitNumber,
                            lineName,
                            row.get("maxSpeed") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : null
                    );
                    entity.updateExtended(
                            equipCode,
                            (String) row.get("modelNm"),
                            (String) row.get("manufacturer"),
                            (String) row.get("purchaseCorpCode"),
                            parseLocalDate(row.get("buyDate")),
                            (String) row.get("voltage"),
                            (String) row.get("pressure"),
                            (String) row.get("installLocation"),
                            (String) row.get("equipTypeCode"),
                            parseBigDecimal(row.get("tactTime")),
                            parseBigDecimal(row.get("equipCapa"))
                    );
                    repository.save(entity);
                }
                case "updated" -> {
                    Object idObj = row.get("id");
                    if (idObj == null) continue;
                    Long id = idObj instanceof Number n ? n.longValue() : Long.parseLong(idObj.toString());
                    MasterEquipment entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("category", entity.getCategory()),
                            (String) row.getOrDefault("unitNumber", entity.getUnitNumber()),
                            (String) row.getOrDefault("lineName", entity.getLineName()),
                            row.get("maxSpeed") instanceof Number n ? BigDecimal.valueOf(n.doubleValue()) : entity.getMaxSpeed(),
                            (String) row.getOrDefault("isActive", entity.getIsActive())
                    );
                    entity.updateExtended(
                            row.containsKey("equipCode") ? (String) row.get("equipCode") : entity.getEquipCode(),
                            row.containsKey("modelNm") ? (String) row.get("modelNm") : entity.getModelNm(),
                            row.containsKey("manufacturer") ? (String) row.get("manufacturer") : entity.getManufacturer(),
                            row.containsKey("purchaseCorpCode") ? (String) row.get("purchaseCorpCode") : entity.getPurchaseCorpCode(),
                            row.containsKey("buyDate") ? parseLocalDate(row.get("buyDate")) : entity.getBuyDate(),
                            row.containsKey("voltage") ? (String) row.get("voltage") : entity.getVoltage(),
                            row.containsKey("pressure") ? (String) row.get("pressure") : entity.getPressure(),
                            row.containsKey("installLocation") ? (String) row.get("installLocation") : entity.getInstallLocation(),
                            row.containsKey("equipTypeCode") ? (String) row.get("equipTypeCode") : entity.getEquipTypeCode(),
                            row.containsKey("tactTime") ? parseBigDecimal(row.get("tactTime")) : entity.getTactTime(),
                            row.containsKey("equipCapa") ? parseBigDecimal(row.get("equipCapa")) : entity.getEquipCapa()
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
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "설비 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] MASTER batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "MM0050", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(MasterEquipment e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("category", e.getCategory());
        map.put("unitNumber", e.getUnitNumber());
        map.put("lineName", e.getLineName());
        map.put("maxSpeed", e.getMaxSpeed());
        map.put("isActive", e.getIsActive());
        map.put("equipCode", e.getEquipCode());
        map.put("modelNm", e.getModelNm());
        map.put("manufacturer", e.getManufacturer());
        map.put("purchaseCorpCode", e.getPurchaseCorpCode());
        map.put("buyDate", e.getBuyDate());
        map.put("voltage", e.getVoltage());
        map.put("pressure", e.getPressure());
        map.put("installLocation", e.getInstallLocation());
        map.put("equipTypeCode", e.getEquipTypeCode());
        map.put("tactTime", e.getTactTime());
        map.put("equipCapa", e.getEquipCapa());
        return map;
    }

    private BigDecimal parseBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalDate parseLocalDate(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDate d) return d;
        try { return LocalDate.parse(v.toString()); } catch (Exception e) { return null; }
    }
}
