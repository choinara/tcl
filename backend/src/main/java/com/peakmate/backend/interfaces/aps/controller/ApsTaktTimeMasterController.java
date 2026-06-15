package com.peakmate.backend.interfaces.aps.controller;

import com.peakmate.backend.domain.aps.entity.ApsTaktTimeMaster;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.aps.ApsTaktTimeMasterJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * APS Takt time CRUD API.
 */
@Slf4j
@RestController
@RequestMapping("/api/aps/takt-times")
@RequiredArgsConstructor
public class ApsTaktTimeMasterController {

    private final ApsTaktTimeMasterJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "PM0042", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam(required = false) String lineCode) {

        List<ApsTaktTimeMaster> items;
        if (lineCode != null && !lineCode.isBlank()) {
            items = repository.findByLineCodeInAndIsActiveOrderByLineCodeAscProductCodeAsc(
                    List.of(lineCode), "Y");
        } else {
            items = repository.findByIsActiveOrderByLineCodeAscProductCodeAsc("Y");
        }

        List<Map<String, Object>> content = items.stream().map(this::toMap).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    @RequirePermission(menu = "PM0042", action = "update")
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
                    String pc = (String) row.getOrDefault("productCode", "");

                    // UNIQUE 중복 검증 (lineCode + productCode)
                    if (!lc.isBlank() && !pc.isBlank()) {
                        if (repository.findByLineCodeAndProductCode(lc, pc).isPresent()) {
                            throw new IllegalArgumentException(
                                    "이미 존재하는 Takt time입니다: " + lc + " / " + pc);
                        }
                    }

                    ApsTaktTimeMaster entity = ApsTaktTimeMaster.create(
                            lc,
                            pc,
                            parseBigDecimal(row.get("taktTimeMinPerKg")),
                            parseInteger(row.get("minWorkerCount"))
                    );
                    repository.save(entity);
                    createdCount++;
                }
                case "updated" -> {
                    Long id = parseLong(row.get("id"));
                    if (id == null) continue;
                    ApsTaktTimeMaster entity = repository.findById(id).orElse(null);
                    if (entity == null) continue;
                    entity.update(
                            parseBigDecimal(row.get("taktTimeMinPerKg")),
                            parseInteger(row.get("minWorkerCount")),
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
            systemLogService.log("DATA_IMPORT", null, currentUser, null, "APS Takt time 저장",
                    "생성 " + createdCount + "건, 수정 " + updatedCount + "건, 삭제 " + deletedCount + "건");
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패] APS Takt time 저장", e);
        }

        return ApiResponse.success("일괄 저장되었습니다");
    }

    private Map<String, Object> toMap(ApsTaktTimeMaster e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("lineCode", e.getLineCode());
        map.put("productCode", e.getProductCode());
        map.put("taktTimeMinPerKg", e.getTaktTimeMinPerKg());
        map.put("minWorkerCount", e.getMinWorkerCount());
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
