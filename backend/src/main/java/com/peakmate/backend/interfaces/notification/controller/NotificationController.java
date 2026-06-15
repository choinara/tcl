package com.peakmate.backend.interfaces.notification.controller;

import com.peakmate.backend.domain.notification.entity.SystemNotification;
import com.peakmate.backend.domain.notification.service.SystemNotificationDomainService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.interfaces.notification.dto.request.CreateNotificationRequest;
import com.peakmate.backend.interfaces.notification.dto.request.UpdateNotificationRequest;
import com.peakmate.backend.infra.repository.notification.SystemNotificationJpaRepository;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 시스템 공지(알림) API Controller.
 * 활성 공지 조회 + 관리자 CRUD.
 */
@RestController
@RequestMapping("/api/system/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SystemNotificationDomainService systemNotificationDomainService;
    private final SystemNotificationJpaRepository systemNotificationJpaRepository;

    /** 현재 활성화된 공지 목록 (배너용, 권한 불필요) */
    @GetMapping("/active")
    public ApiResponse<List<Map<String, Object>>> getActiveNotifications() {
        List<SystemNotification> notifications = systemNotificationDomainService.getActiveNotifications();
        List<Map<String, Object>> result = notifications.stream()
                .map(this::toMap).collect(Collectors.toList());
        return ApiResponse.success(result);
    }

    /** 전체 공지 목록 (관리자용, 페이징) */
    @RequirePermission(menu = "SM0070", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<SystemNotification> result = systemNotificationJpaRepository.findByUseYnOrderByCreatedAtDesc(
                "Y", PageRequest.of(page, size));

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toMap).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ApiResponse.success(response);
    }

    /** 공지 등록 */
    @RequirePermission(menu = "SM0070", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreateNotificationRequest request) {
        String message = request.message();
        boolean active = request.active() == null || request.active();
        LocalDateTime startAt = parseDateTime(request.startAt());
        LocalDateTime endAt = parseDateTime(request.endAt());

        SystemNotification notif = SystemNotification.create(message, active, startAt, endAt);
        SystemNotification saved = systemNotificationJpaRepository.save(notif);
        return ApiResponse.success(toMap(saved));
    }

    /** 공지 수정 */
    @RequirePermission(menu = "SM0070", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @Valid @RequestBody UpdateNotificationRequest request) {
        SystemNotification notif = systemNotificationJpaRepository.findById(id).orElse(null);
        if (notif == null) return ApiResponse.error("NOTIF001", "알림을 찾을 수 없습니다.");

        String message = request.message() != null ? request.message() : notif.getTitle();
        boolean active = request.active() != null ? request.active() : "Y".equals(notif.getUseYn());
        LocalDateTime startAt = request.startAt() != null ? parseDateTime(request.startAt()) : notif.getStartDate();
        LocalDateTime endAt = request.endAt() != null ? parseDateTime(request.endAt()) : notif.getEndDate();

        notif.update(message, active, startAt, endAt);
        SystemNotification saved = systemNotificationJpaRepository.save(notif);
        return ApiResponse.success(toMap(saved));
    }

    /** 공지 삭제 (비활성화) */
    @RequirePermission(menu = "SM0070", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        SystemNotification notif = systemNotificationJpaRepository.findById(id).orElse(null);
        if (notif == null) return ApiResponse.error("NOTIF001", "알림을 찾을 수 없습니다.");
        notif.update(notif.getTitle(), false, notif.getStartDate(), notif.getEndDate());
        systemNotificationJpaRepository.save(notif);
        return ApiResponse.success("삭제되었습니다");
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> toMap(SystemNotification n) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", n.getId());
        map.put("message", n.getTitle());
        map.put("active", "Y".equals(n.getUseYn()));
        map.put("startAt", n.getStartDate());
        map.put("endAt", n.getEndDate());
        map.put("createdBy", n.getCreatedBy());
        map.put("createdAt", n.getCreatedAt());
        return map;
    }
}
