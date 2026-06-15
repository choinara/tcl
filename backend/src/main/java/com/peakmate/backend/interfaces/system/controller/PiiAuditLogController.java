package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.auth.entity.PiiAuditLog;
import com.peakmate.backend.domain.auth.repository.PiiAuditLogRepository;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 개인정보 처리 감사 로그 조회 API.
 */
@RestController
@RequestMapping("/api/system/pii-audit-logs")
@RequiredArgsConstructor
public class PiiAuditLogController {

    private final PiiAuditLogRepository piiAuditLogRepository;

    @RequirePermission(menu = "SM0060", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<PiiAuditLog> result = piiAuditLogRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toMap)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ApiResponse.success(response);
    }

    private Map<String, Object> toMap(PiiAuditLog log) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", log.getId());
        map.put("eventType", log.getEventType());
        map.put("targetTable", log.getTargetTable());
        map.put("targetId", log.getTargetId());
        map.put("fieldName", log.getFieldName());
        map.put("actorUsername", log.getActorUsername());
        map.put("actorIp", log.getActorIp());
        map.put("detail", log.getDetail());
        map.put("createdAt", log.getCreatedAt());
        return map;
    }
}
