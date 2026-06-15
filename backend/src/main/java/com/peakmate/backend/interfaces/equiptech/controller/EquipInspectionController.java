package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipInspection;
import com.peakmate.backend.domain.equiptech.entity.EquipInspectionResult;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.equiptech.EquipInspectionJpaRepository;
import com.peakmate.backend.infra.repository.equiptech.EquipInspectionResultJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ET0020: 정기검사관리
 */
@Slf4j
@RestController
@RequestMapping("/api/et/inspection")
@RequiredArgsConstructor
public class EquipInspectionController {

    private final EquipInspectionJpaRepository repository;
    private final EquipInspectionResultJpaRepository resultRepository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "ET0020", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        List<EquipInspection> all = repository.findAllByOrderByInspectDateDescIdDesc();
        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        if (status != null && !status.isBlank()) {
            content = content.stream()
                    .filter(m -> status.equals(m.get("status")))
                    .collect(Collectors.toList());
        }
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

    @RequirePermission(menu = "ET0020", action = "read")
    @GetMapping("/{id}/results")
    public ApiResponse<List<Map<String, Object>>> findResults(@PathVariable Long id) {
        List<EquipInspectionResult> results = resultRepository.findByInspectionIdOrderByItemNo(id);
        return ApiResponse.success(results.stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("inspectionId", r.getInspectionId());
            map.put("itemNo", r.getItemNo());
            map.put("resultCode", r.getResultCode());
            map.put("note", r.getNote());
            return map;
        }).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "ET0020", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        EquipInspection entity = EquipInspection.create(
                parseLong(body.get("equipId")),
                parseDate(body.get("inspectDate")),
                (String) body.get("inspector"),
                (String) body.getOrDefault("status", "PENDING"),
                (String) body.get("remark")
        );
        EquipInspection saved = repository.save(entity);

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null,
                    "정기검사 일정 등록", saved.getInspectDate().toString());
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패]", e);
        }
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0020", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body) {
        EquipInspection entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("검사 일정을 찾을 수 없습니다: " + id));
        entity.update(
                parseLong(body.get("equipId")),
                parseDate(body.get("inspectDate")),
                (String) body.get("inspector"),
                (String) body.getOrDefault("status", entity.getStatus()),
                (String) body.get("remark")
        );
        return ApiResponse.success(toMap(repository.save(entity)));
    }

    @RequirePermission(menu = "ET0020", action = "update")
    @Transactional
    @PostMapping("/{id}/results/batch")
    public ApiResponse<Void> saveResults(@PathVariable Long id,
                                         @RequestBody List<Map<String, Object>> results) {
        resultRepository.deleteByInspectionId(id);

        for (Map<String, Object> r : results) {
            Integer itemNo = parseInteger(r.get("itemNo"));
            if (itemNo == null) continue;
            EquipInspectionResult result = EquipInspectionResult.create(
                    id, itemNo, (String) r.get("resultCode"), (String) r.get("note"));
            resultRepository.save(result);
        }

        List<EquipInspectionResult> saved = resultRepository.findByInspectionIdOrderByItemNo(id);
        boolean allDone = saved.size() >= 18
                && saved.stream().allMatch(r -> r.getResultCode() != null && !r.getResultCode().isBlank());
        if (allDone) {
            EquipInspection inspection = repository.findById(id).orElse(null);
            if (inspection != null) {
                inspection.update(inspection.getEquipId(), inspection.getInspectDate(),
                        inspection.getInspector(), "COMPLETED", inspection.getRemark());
                repository.save(inspection);
            }
        }

        return ApiResponse.success("저장되었습니다");
    }

    @RequirePermission(menu = "ET0020", action = "delete")
    @Transactional
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        resultRepository.deleteByInspectionId(id);
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(EquipInspection e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("equipId", e.getEquipId());
        map.put("inspectDate", e.getInspectDate());
        map.put("inspector", e.getInspector());
        map.put("status", e.getStatus());
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

    private Integer parseInteger(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }
}
