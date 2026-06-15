package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipOperationPlan;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.equiptech.EquipOperationPlanJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/et/operation-plan")
@RequiredArgsConstructor
public class EquipOperationPlanController {

    private final EquipOperationPlanJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "ET0110", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        List<EquipOperationPlan> all;
        LocalDate start = parseDate(startDate);
        LocalDate end   = parseDate(endDate);

        if (start != null && end != null) {
            all = repository.findByPlanDateBetweenOrderByEquipIdAscPlanDateAsc(start, end);
        } else {
            all = repository.findAll();
        }

        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", content.size());
        return ApiResponse.success(response);
    }

    @RequirePermission(menu = "ET0110", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        EquipOperationPlan entity = EquipOperationPlan.create(
                parseLong(body.get("equipId")),
                parseDate(body.get("planDate")),
                (String) body.get("eventTypeCode"),
                (String) body.get("eventContent"),
                parseBigDecimal(body.get("stdTimeH")),
                parseTime(body.get("startTime")),
                parseTime(body.get("endTime")),
                parseBigDecimal(body.get("availTimeH")),
                (String) body.get("remark")
        );
        EquipOperationPlan saved = repository.save(entity);
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null,
                    "설비가동계획 등록", "ID: " + saved.getId());
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패]", e);
        }
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0110", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body) {
        EquipOperationPlan entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("설비가동계획을 찾을 수 없습니다: " + id));
        entity.update(
                parseLong(body.get("equipId")),
                parseDate(body.get("planDate")),
                (String) body.get("eventTypeCode"),
                (String) body.get("eventContent"),
                parseBigDecimal(body.get("stdTimeH")),
                parseTime(body.get("startTime")),
                parseTime(body.get("endTime")),
                parseBigDecimal(body.get("availTimeH")),
                (String) body.get("remark")
        );
        EquipOperationPlan saved = repository.save(entity);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0110", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(EquipOperationPlan e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("equipId", e.getEquipId());
        map.put("planDate", e.getPlanDate());
        map.put("eventTypeCode", e.getEventTypeCode());
        map.put("eventContent", e.getEventContent());
        map.put("stdTimeH", e.getStdTimeH());
        map.put("startTime", e.getStartTime());
        map.put("endTime", e.getEndTime());
        map.put("availTimeH", e.getAvailTimeH());
        map.put("remark", e.getRemark());
        return map;
    }

    private Long parseLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }

    private BigDecimal parseBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalDate parseDate(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDate d) return d;
        try { return LocalDate.parse(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalTime parseTime(Object v) {
        if (v == null) return null;
        if (v instanceof LocalTime t) return t;
        String s = v.toString().trim();
        if (s.isEmpty()) return null;
        try { return LocalTime.parse(s); } catch (Exception e) { return null; }
    }
}
