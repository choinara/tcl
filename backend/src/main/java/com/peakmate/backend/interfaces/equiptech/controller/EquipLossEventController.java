package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipLossEvent;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.equiptech.EquipLossEventJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/et/loss-event")
@RequiredArgsConstructor
public class EquipLossEventController {

    private final EquipLossEventJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "ET0100", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long equipId,
            @RequestParam(required = false) String lossTypeCode) {
        List<EquipLossEvent> all;
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);

        if (equipId != null && start != null && end != null) {
            all = repository.findByEquipIdAndFailDateBetweenOrderByFailDateDescIdDesc(equipId, start, end);
        } else if (start != null && end != null) {
            all = repository.findByFailDateBetweenOrderByFailDateDescIdDesc(start, end);
        } else if (equipId != null) {
            all = repository.findByEquipIdOrderByFailDateDescIdDesc(equipId);
        } else {
            all = repository.findAllByOrderByFailDateDescIdDesc();
        }

        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        if (lossTypeCode != null && !lossTypeCode.isBlank()) {
            content = content.stream()
                    .filter(m -> lossTypeCode.equals(m.get("lossTypeCode")))
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

    @RequirePermission(menu = "ET0100", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        EquipLossEvent entity = EquipLossEvent.create(
                parseLong(body.get("equipId")),
                parseDate(body.get("failDate")),
                parseTime(body.get("failTime")),
                parseDate(body.get("recoveryDate")),
                parseTime(body.get("recoveryTime")),
                parseInteger(body.get("lossTimeMin")),
                (String) body.get("lossTypeCode"),
                (String) body.get("shiftCode"),
                (String) body.get("lossCause"),
                (String) body.get("lossAction"),
                (String) body.get("remark"),
                (String) body.getOrDefault("isClosed", "N")
        );
        EquipLossEvent saved = repository.save(entity);
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "설비 Loss 이벤트 등록", "ID: " + saved.getId());
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패]", e);
        }
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0100", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        EquipLossEvent entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loss 이벤트를 찾을 수 없습니다: " + id));
        entity.update(
                parseLong(body.get("equipId")),
                parseDate(body.get("failDate")),
                parseTime(body.get("failTime")),
                parseDate(body.get("recoveryDate")),
                parseTime(body.get("recoveryTime")),
                parseInteger(body.get("lossTimeMin")),
                (String) body.get("lossTypeCode"),
                (String) body.get("shiftCode"),
                (String) body.get("lossCause"),
                (String) body.get("lossAction"),
                (String) body.get("remark"),
                (String) body.getOrDefault("isClosed", entity.getIsClosed())
        );
        EquipLossEvent saved = repository.save(entity);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0100", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private Map<String, Object> toMap(EquipLossEvent e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("equipId", e.getEquipId());
        map.put("failDate", e.getFailDate());
        map.put("failTime", e.getFailTime());
        map.put("recoveryDate", e.getRecoveryDate());
        map.put("recoveryTime", e.getRecoveryTime());
        map.put("lossTimeMin", e.getLossTimeMin());
        map.put("lossTypeCode", e.getLossTypeCode());
        map.put("shiftCode", e.getShiftCode());
        map.put("lossCause", e.getLossCause());
        map.put("lossAction", e.getLossAction());
        map.put("remark", e.getRemark());
        map.put("isClosed", e.getIsClosed());
        return map;
    }

    private Long parseLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }

    private Integer parseInteger(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalDate parseDate(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDate d) return d;
        try { return LocalDate.parse(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalTime parseTime(Object v) {
        if (v == null) return null;
        if (v instanceof LocalTime t) return t;
        try { return LocalTime.parse(v.toString()); } catch (Exception e) { return null; }
    }
}
