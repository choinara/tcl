package com.peakmate.backend.interfaces.system.controller;

import com.peakmate.backend.domain.bulletin.entity.SystemBulletin;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.backend.global.util.PersonalInfoDetector;
import com.peakmate.backend.infra.repository.bulletin.SystemBulletinJpaRepository;
import com.peakmate.backend.interfaces.system.dto.request.CreateBulletinRequest;
import com.peakmate.backend.interfaces.system.dto.request.UpdateBulletinRequest;
import com.peakmate.core.security.annotation.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@io.swagger.v3.oas.annotations.tags.Tag(name = "게시판", description = "시스템 공지/게시판 관리 API")
@RestController
@RequestMapping("/api/system/bulletins")
@RequiredArgsConstructor
public class SystemBulletinController {

    private final SystemBulletinJpaRepository systemBulletinJpaRepository;

    @RequirePermission(menu = "SM0070", action = "read")
    @GetMapping
    public ApiResponse<Map<String, Object>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<SystemBulletin> result = systemBulletinJpaRepository.findByIsActiveOrderByCreatedAtDesc(
                "Y", PageRequest.of(page, size));

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toMap).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ApiResponse.success(response);
    }

    @GetMapping("/login-popup")
    public ApiResponse<List<Map<String, Object>>> getLoginPopup() {
        List<SystemBulletin> bulletins = systemBulletinJpaRepository.findActiveForLoginPopup();
        return ApiResponse.success(bulletins.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @RequirePermission(menu = "SM0070", action = "create")
    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreateBulletinRequest request) {
        // 개인정보 포함 여부 검사
        String fullText = request.title() + " " + request.content();
        var piiResults = PersonalInfoDetector.detect(fullText);
        if (!piiResults.isEmpty()) {
            String types = piiResults.stream()
                    .map(PersonalInfoDetector.DetectionResult::type)
                    .distinct()
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            return ApiResponse.error("PII001",
                    "게시물에 개인정보(%s)가 포함되어 있습니다. 개인정보를 삭제 후 다시 시도하세요.".formatted(types));
        }

        SystemBulletin bulletin = SystemBulletin.create(
                request.title(),
                request.content(),
                request.popupOnLogin() == null || request.popupOnLogin(),
                parseDate(request.validFrom()),
                parseDate(request.validTo()),
                request.active() == null || request.active()
        );
        SystemBulletin saved = systemBulletinJpaRepository.save(bulletin);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "SM0070", action = "update")
    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @Valid @RequestBody UpdateBulletinRequest request) {
        SystemBulletin bulletin = systemBulletinJpaRepository.findById(id).orElse(null);
        if (bulletin == null) return ApiResponse.error("BULL001", "게시물을 찾을 수 없습니다.");

        // 개인정보 포함 여부 검사
        String updateTitle = request.title() != null ? request.title() : "";
        String updateContent = request.content() != null ? request.content() : "";
        String updateFullText = updateTitle + " " + updateContent;
        var updatePiiResults = PersonalInfoDetector.detect(updateFullText);
        if (!updatePiiResults.isEmpty()) {
            String types = updatePiiResults.stream()
                    .map(PersonalInfoDetector.DetectionResult::type)
                    .distinct()
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            return ApiResponse.error("PII001",
                    "게시물에 개인정보(%s)가 포함되어 있습니다. 개인정보를 삭제 후 다시 시도하세요.".formatted(types));
        }

        bulletin.update(
                request.title() != null ? request.title() : bulletin.getTitle(),
                request.content() != null ? request.content() : bulletin.getContent(),
                request.popupOnLogin() != null ? request.popupOnLogin() : "Y".equals(bulletin.getPopupOnLogin()),
                request.validFrom() != null ? parseDate(request.validFrom()) : bulletin.getValidFrom(),
                request.validTo() != null ? parseDate(request.validTo()) : bulletin.getValidTo(),
                request.active() != null ? request.active() : "Y".equals(bulletin.getIsActive())
        );
        SystemBulletin saved = systemBulletinJpaRepository.save(bulletin);
        return ApiResponse.success(toMap(saved));
    }

    @RequirePermission(menu = "SM0070", action = "delete")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        SystemBulletin bulletin = systemBulletinJpaRepository.findById(id).orElse(null);
        if (bulletin == null) return ApiResponse.error("BULL001", "게시물을 찾을 수 없습니다.");
        bulletin.deactivate();
        systemBulletinJpaRepository.save(bulletin);
        return ApiResponse.success("삭제되었습니다");
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.length() > 10 ? value.substring(0, 10) : value);
        } catch (Exception e) {
            return null;
        }
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }

    private Map<String, Object> toMap(SystemBulletin b) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", b.getId());
        map.put("title", b.getTitle());
        map.put("content", b.getContent());
        map.put("popupOnLogin", "Y".equals(b.getPopupOnLogin()));
        map.put("validFrom", b.getValidFrom());
        map.put("validTo", b.getValidTo());
        map.put("active", "Y".equals(b.getIsActive()));
        map.put("createdBy", b.getCreatedBy());
        map.put("createdAt", b.getCreatedAt());
        return map;
    }
}
