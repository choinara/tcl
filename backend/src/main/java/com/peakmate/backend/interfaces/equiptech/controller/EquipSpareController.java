package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipSpare;
import com.peakmate.backend.domain.equiptech.entity.EquipSpareInout;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.equiptech.EquipSpareInoutJpaRepository;
import com.peakmate.backend.infra.repository.equiptech.EquipSpareJpaRepository;
import com.peakmate.core.common.ApiResponse;
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
@RequestMapping("/api/et/spare")
@RequiredArgsConstructor
public class EquipSpareController {

    private final EquipSpareJpaRepository spareRepository;
    private final EquipSpareInoutJpaRepository inoutRepository;
    private final SystemLogService systemLogService;

    // ===== Spare Master =====

    @RequirePermission(menu = "ET0050", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String isActive) {
        List<EquipSpare> all = spareRepository.findAllByOrderByIdAsc();
        List<Map<String, Object>> content = all.stream().map(this::spareToMap).collect(Collectors.toList());

        if (isActive != null && !isActive.isBlank()) {
            content = content.stream().filter(m -> isActive.equals(m.get("isActive"))).collect(Collectors.toList());
        }
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            content = content.stream()
                    .filter(m -> m.values().stream().anyMatch(v -> v != null && v.toString().toLowerCase().contains(kw)))
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

    @RequirePermission(menu = "ET0050", action = "create")
    @PostMapping("/batch")
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        int createdCount = 0;
        int updatedCount = 0;
        int deletedCount = 0;
        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;
            switch (rowState) {
                case "created" -> {
                    String spareCode = (String) row.getOrDefault("spareCode", "");
                    if (spareCode != null && !spareCode.isBlank() && spareRepository.findBySpareCode(spareCode).isPresent()) {
                        throw new IllegalArgumentException("이미 존재하는 Spare 코드입니다: " + spareCode);
                    }
                    EquipSpare entity = EquipSpare.create(
                            spareCode,
                            (String) row.getOrDefault("spareName", ""),
                            (String) row.get("spareSpec"),
                            (String) row.get("unit"),
                            parseBigDecimal(row.get("unitPrice")),
                            parseBigDecimal(row.get("stockQty")),
                            parseBigDecimal(row.get("minStockQty")),
                            (String) row.get("spareTypeCode"),
                            (String) row.get("equipCategoryCode"),
                            (String) row.getOrDefault("isActive", "Y"),
                            (String) row.get("remark")
                    );
                    spareRepository.save(entity);
                    createdCount++;
                }
                case "updated" -> {
                    Long id = parseLong(row.get("id"));
                    if (id == null) continue;
                    EquipSpare entity = spareRepository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("spareName", entity.getSpareName()),
                            (String) row.getOrDefault("spareSpec", entity.getSpareSpec()),
                            (String) row.getOrDefault("unit", entity.getUnit()),
                            parseBigDecimal(row.get("unitPrice")),
                            parseBigDecimal(row.get("stockQty")),
                            parseBigDecimal(row.get("minStockQty")),
                            (String) row.getOrDefault("spareTypeCode", entity.getSpareTypeCode()),
                            (String) row.getOrDefault("equipCategoryCode", entity.getEquipCategoryCode()),
                            (String) row.getOrDefault("isActive", entity.getIsActive()),
                            (String) row.getOrDefault("remark", entity.getRemark())
                    );
                    spareRepository.save(entity);
                    updatedCount++;
                }
                case "deleted" -> {
                    Long id = parseLong(row.get("id"));
                    if (id != null) {
                        spareRepository.deleteById(id);
                        deletedCount++;
                    }
                }
            }
        }
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "Spare 일괄저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] Spare batch", e);
        }
        return ApiResponse.success("일괄 저장되었습니다");
    }

    @RequirePermission(menu = "ET0050", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        spareRepository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    // ===== Spare In/Out =====

    @RequirePermission(menu = "ET0050", action = "read")
    @GetMapping("/{spareId}/inout")
    public ApiResponse<List<Map<String, Object>>> findInout(@PathVariable Long spareId) {
        List<EquipSpareInout> list = inoutRepository.findBySpareIdOrderByInoutDateDescIdDesc(spareId);
        return ApiResponse.success(list.stream().map(this::inoutToMap).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "ET0050", action = "create")
    @PostMapping("/{spareId}/inout")
    public ApiResponse<Map<String, Object>> createInout(@PathVariable Long spareId, @RequestBody Map<String, Object> body) {
        EquipSpare spare = spareRepository.findById(spareId)
                .orElseThrow(() -> new IllegalArgumentException("Spare를 찾을 수 없습니다: " + spareId));

        String inoutType = (String) body.getOrDefault("inoutType", "IN");
        BigDecimal qty = parseBigDecimal(body.get("qty"));
        if (qty == null) throw new IllegalArgumentException("수량을 입력해주세요");

        BigDecimal delta = "IN".equals(inoutType) ? qty : qty.negate();
        spare.adjustStock(delta);
        spareRepository.save(spare);

        EquipSpareInout entity = EquipSpareInout.create(
                spareId, inoutType, qty,
                parseDate(body.get("inoutDate")),
                parseLong(body.get("usedEquipId")),
                (String) body.get("reason"),
                (String) body.get("inoutBy"),
                (String) body.get("remark")
        );
        EquipSpareInout saved = inoutRepository.save(entity);
        return ApiResponse.success(inoutToMap(saved));
    }

    @RequirePermission(menu = "ET0050", action = "delete")
    @DeleteMapping("/{spareId}/inout/{inoutId}")
    public ApiResponse<Void> deleteInout(@PathVariable Long spareId, @PathVariable Long inoutId) {
        EquipSpareInout inout = inoutRepository.findById(inoutId)
                .orElseThrow(() -> new IllegalArgumentException("입출고 이력을 찾을 수 없습니다: " + inoutId));
        EquipSpare spare = spareRepository.findById(spareId).orElse(null);
        if (spare != null) {
            BigDecimal delta = "IN".equals(inout.getInoutType()) ? inout.getQty().negate() : inout.getQty();
            spare.adjustStock(delta);
            spareRepository.save(spare);
        }
        inoutRepository.deleteById(inoutId);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> spareToMap(EquipSpare e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("spareCode", e.getSpareCode());
        map.put("spareName", e.getSpareName());
        map.put("spareSpec", e.getSpareSpec());
        map.put("unit", e.getUnit());
        map.put("unitPrice", e.getUnitPrice());
        map.put("stockQty", e.getStockQty());
        map.put("minStockQty", e.getMinStockQty());
        map.put("spareTypeCode", e.getSpareTypeCode());
        map.put("equipCategoryCode", e.getEquipCategoryCode());
        map.put("isActive", e.getIsActive());
        map.put("remark", e.getRemark());
        return map;
    }

    private Map<String, Object> inoutToMap(EquipSpareInout e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("spareId", e.getSpareId());
        map.put("inoutType", e.getInoutType());
        map.put("qty", e.getQty());
        map.put("inoutDate", e.getInoutDate());
        map.put("usedEquipId", e.getUsedEquipId());
        map.put("reason", e.getReason());
        map.put("inoutBy", e.getInoutBy());
        map.put("remark", e.getRemark());
        return map;
    }

    private Long parseLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalDate parseDate(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDate d) return d;
        try { return LocalDate.parse(v.toString()); } catch (Exception e) { return null; }
    }

    private BigDecimal parseBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return null; }
    }
}
