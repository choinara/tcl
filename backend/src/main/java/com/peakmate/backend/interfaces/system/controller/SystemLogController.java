package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.log.entity.SystemLog;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.infra.repository.log.SystemLogJpaRepository;
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

@RestController
@RequestMapping("/api/system/logs")
@RequiredArgsConstructor
public class SystemLogController {

    private final SystemLogJpaRepository systemLogJpaRepository;

    @RequirePermission(menu = "SM0060", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String logType) {

        String searchTerm = keyword != null ? keyword : search;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SystemLog> result = (logType != null && !logType.isBlank())
                ? systemLogJpaRepository.findByLogTypeAndKeyword(logType, searchTerm, pageRequest)
                : systemLogJpaRepository.findByKeyword(searchTerm, pageRequest);

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toMap)
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ApiResponse.success(response);
    }

    private Map<String, Object> toMap(SystemLog log) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", log.getId());
        map.put("logType", log.getLogType());
        map.put("username", log.getUsername());
        map.put("ipAddress", log.getIpAddress());
        map.put("action", log.getAction());
        map.put("detail", log.getDetail());
        map.put("loggedAt", log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
        return map;
    }
}
