package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipRepairHist;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.equiptech.EquipRepairHistJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/et/repair-hist")
@RequiredArgsConstructor
public class EquipRepairHistController {

    private final EquipRepairHistJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "ET0030", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String isClosed) {
        List<EquipRepairHist> all = repository.findAllByOrderByIdDesc();
        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            content = content.stream()
                    .filter(m -> m.values().stream()
                            .anyMatch(v -> v != null && v.toString().toLowerCase().contains(kw)))
                    .collect(Collectors.toList());
        }
        if (isClosed != null && !isClosed.isBlank()) {
            content = content.stream()
                    .filter(m -> isClosed.equals(m.get("isClosed")))
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

    @RequirePermission(menu = "ET0030", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        String repairNo = generateRepairNo();
        EquipRepairHist entity = EquipRepairHist.create(
                repairNo,
                parseLong(body.get("equipId")),
                parseDate(body.get("failDate")),
                parseDate(body.get("repairStartDate")),
                parseDate(body.get("repairEndDate")),
                (String) body.get("failDesc"),
                (String) body.get("repairDesc"),
                (String) body.get("repairPerson"),
                parseBigDecimal(body.get("repairTime")),
                parseBigDecimal(body.get("repairCost")),
                (String) body.get("failTypeCode"),
                (String) body.get("shiftCode"),
                (String) body.getOrDefault("isClosed", "N"),
                (String) body.get("remark")
        );
        EquipRepairHist saved = repository.save(entity);
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("MASTER_CREATE", null, currentUser, null, "설비 수리이력 등록", repairNo);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패]", e);
        }
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0030", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        EquipRepairHist entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("수리이력을 찾을 수 없습니다: " + id));
        entity.update(
                parseLong(body.get("equipId")),
                parseDate(body.get("failDate")),
                parseDate(body.get("repairStartDate")),
                parseDate(body.get("repairEndDate")),
                (String) body.get("failDesc"),
                (String) body.get("repairDesc"),
                (String) body.get("repairPerson"),
                parseBigDecimal(body.get("repairTime")),
                parseBigDecimal(body.get("repairCost")),
                (String) body.get("failTypeCode"),
                (String) body.get("shiftCode"),
                (String) body.getOrDefault("isClosed", entity.getIsClosed()),
                (String) body.get("remark")
        );
        EquipRepairHist saved = repository.save(entity);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "ET0030", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success("삭제되었습니다");
    }

    private String generateRepairNo() {
        String prefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = repository.count() + 1;
        return prefix + "-" + String.format("%03d", count % 1000);
    }

    private Map<String, Object> toMap(EquipRepairHist e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("repairNo", e.getRepairNo());
        map.put("equipId", e.getEquipId());
        map.put("failDate", e.getFailDate());
        map.put("repairStartDate", e.getRepairStartDate());
        map.put("repairEndDate", e.getRepairEndDate());
        map.put("failDesc", e.getFailDesc());
        map.put("repairDesc", e.getRepairDesc());
        map.put("repairPerson", e.getRepairPerson());
        map.put("repairTime", e.getRepairTime());
        map.put("repairCost", e.getRepairCost());
        map.put("failTypeCode", e.getFailTypeCode());
        map.put("shiftCode", e.getShiftCode());
        map.put("isClosed", e.getIsClosed());
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
