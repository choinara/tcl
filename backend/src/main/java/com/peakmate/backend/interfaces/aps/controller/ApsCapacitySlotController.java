package com.peakmate.backend.interfaces.aps.controller;

import com.peakmate.backend.domain.aps.entity.ApsCapacitySlot;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.aps.ApsCapacitySlotJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * APS 가용능력 CRUD API.
 */
@Slf4j
@RestController
@RequestMapping("/api/aps/capacity-slots")
@RequiredArgsConstructor
public class ApsCapacitySlotController {

    private final ApsCapacitySlotJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "PM0041", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String lineCode) {

        LocalDate from = LocalDate.parse(startDate);
        LocalDate to = LocalDate.parse(endDate);

        List<ApsCapacitySlot> slots;
        if (lineCode != null && !lineCode.isBlank()) {
            slots = repository.findByLineCodeInAndSlotDateBetweenOrderBySlotDateAscLineCodeAsc(
                    List.of(lineCode), from, to);
        } else {
            slots = repository.findBySlotDateBetweenAndIsActiveOrderBySlotDateAscLineCodeAsc(from, to, "Y");
        }

        List<Map<String, Object>> content = slots.stream().map(this::toMap).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    @RequirePermission(menu = "PM0041", action = "update")
    @PostMapping("/batch")
    @Transactional
    public ApiResponse<Void> batchSave(@RequestBody List<Map<String, Object>> rows) {
        int createdCount = 0, updatedCount = 0, deletedCount = 0;

        for (Map<String, Object> row : rows) {
            String rowState = (String) row.get("_rowState");
            if (rowState == null) continue;

            switch (rowState) {
                case "created" -> {
                    String lc = (String) row.getOrDefault("lineCode", "");
                    String sd = (String) row.getOrDefault("slotDate", "");
                    String shift = (String) row.getOrDefault("shift", "");

                    // UNIQUE 중복 검증
                    if (!lc.isBlank() && !sd.isBlank() && !shift.isBlank()) {
                        if (repository.findByLineCodeAndSlotDateAndShift(lc, LocalDate.parse(sd), shift).isPresent()) {
                            throw new IllegalArgumentException(
                                    "이미 존재하는 가용능력입니다: " + lc + " / " + sd + " / " + shift);
                        }
                    }

                    ApsCapacitySlot entity = ApsCapacitySlot.create(
                            lc,
                            sd.isBlank() ? null : LocalDate.parse(sd),
                            shift,
                            (String) row.getOrDefault("crew", ""),
                            parseInteger(row.get("workerCount")),
                            parseBigDecimal(row.get("availHours")),
                            parseBigDecimal(row.get("availWeightKg"))
                    );
                    repository.save(entity);
                    createdCount++;
                }
                case "updated" -> {
                    Long id = parseLong(row.get("id"));
                    if (id == null) continue;
                    ApsCapacitySlot entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            (String) row.getOrDefault("crew", entity.getCrew()),
                            parseInteger(row.get("workerCount")),
                            parseBigDecimal(row.get("availHours")),
                            parseBigDecimal(row.get("availWeightKg")),
                            (String) row.getOrDefault("isActive", entity.getIsActive())
                    );
                    repository.save(entity);
                    updatedCount++;
                }
                case "deleted" -> {
                    Long id = parseLong(row.get("id"));
                    if (id == null) continue;
                    repository.deleteById(id);
                    deletedCount++;
                }
            }
        }

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("DATA_IMPORT", null, currentUser, null, "APS 가용능력 저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS 가용능력 저장", e);
        }

        return ApiResponse.success("일괄 저장되었습니다");
    }

    private Map<String, Object> toMap(ApsCapacitySlot e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("lineCode", e.getLineCode());
        map.put("slotDate", e.getSlotDate());
        map.put("shift", e.getShift());
        map.put("crew", e.getCrew());
        map.put("workerCount", e.getWorkerCount());
        map.put("availHours", e.getAvailHours());
        map.put("availWeightKg", e.getAvailWeightKg());
        map.put("isActive", e.getIsActive());
        return map;
    }

    private Long parseLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number n) return n.longValue();
        try { return Long.parseLong(obj.toString()); } catch (NumberFormatException e) { return null; }
    }

    private Integer parseInteger(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number n) return n.intValue();
        try { return Integer.parseInt(obj.toString()); } catch (NumberFormatException e) { return null; }
    }

    private BigDecimal parseBigDecimal(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(obj.toString()); } catch (NumberFormatException e) { return null; }
    }
}
