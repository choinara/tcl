package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipRepairHist;
import com.peakmate.backend.infra.repository.equiptech.EquipRepairHistJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ET0010: 설비보전이력관리 (read-only)
 * equip_repair_hist 데이터를 조회 전용으로 제공한다.
 */
@RestController
@RequestMapping("/api/et/maintenance")
@RequiredArgsConstructor
public class EquipMaintenanceController {

    private final EquipRepairHistJpaRepository repository;

    @RequirePermission(menu = "ET0010", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String isClosed) {
        List<EquipRepairHist> all = repository.findAllByOrderByIdDesc();
        List<Map<String, Object>> content = all.stream().map(this::toMap).collect(Collectors.toList());

        if (isClosed != null && !isClosed.isBlank()) {
            content = content.stream()
                    .filter(m -> isClosed.equals(m.get("isClosed")))
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
}
