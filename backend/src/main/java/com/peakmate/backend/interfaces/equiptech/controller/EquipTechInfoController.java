package com.peakmate.backend.interfaces.equiptech.controller;

import com.peakmate.backend.domain.equiptech.entity.EquipTechInfo;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.infra.repository.equiptech.EquipTechInfoJpaRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ET0090: 설비기술기준정보 (MTBF/MTTR 관리 기준 설정)
 */
@Slf4j
@RestController
@RequestMapping("/api/et/tech-info")
@RequiredArgsConstructor
public class EquipTechInfoController {

    private final EquipTechInfoJpaRepository repository;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "ET0090", action = "read")
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> findAll() {
        return ApiResponse.success(
                repository.findAllByOrderByEquipCategoryCode().stream()
                        .map(this::toMap)
                        .collect(Collectors.toList())
        );
    }

    @RequirePermission(menu = "ET0090", action = "update")
    @PostMapping("/upsert")
    public ApiResponse<Map<String, Object>> upsert(@RequestBody Map<String, Object> body) {
        String categoryCode = (String) body.get("equipCategoryCode");
        if (categoryCode == null || categoryCode.isBlank()) {
            throw new IllegalArgumentException("설비 카테고리를 선택해주세요");
        }

        EquipTechInfo info = repository.findByEquipCategoryCode(categoryCode)
                .orElseGet(() -> EquipTechInfo.create(categoryCode));
        info.upsert(
                parseInteger(body.get("mtbfTargetMin")),
                parseInteger(body.get("mtbfUclMin")),
                (String) body.get("mtbfLossTypeCodes"),
                parseInteger(body.get("mttrTargetMin")),
                parseInteger(body.get("mttrUclMin")),
                (String) body.get("mttrLossTypeCodes")
        );
        EquipTechInfo saved = repository.save(info);

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            systemLogService.log("SETTING_CHANGE", null, currentUser, null,
                    "설비기술기준정보 저장", categoryCode);
        } catch (Exception e) {
            log.warn("[시스템 로그 기록 실패]", e);
        }
        return ApiResponse.success(toMap(saved));
    }

    private Map<String, Object> toMap(EquipTechInfo e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("equipCategoryCode", e.getEquipCategoryCode());
        map.put("mtbfTargetMin", e.getMtbfTargetMin());
        map.put("mtbfUclMin", e.getMtbfUclMin());
        map.put("mtbfLossTypeCodes", e.getMtbfLossTypeCodes());
        map.put("mttrTargetMin", e.getMttrTargetMin());
        map.put("mttrUclMin", e.getMttrUclMin());
        map.put("mttrLossTypeCodes", e.getMttrLossTypeCodes());
        return map;
    }

    private Integer parseInteger(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }
}
