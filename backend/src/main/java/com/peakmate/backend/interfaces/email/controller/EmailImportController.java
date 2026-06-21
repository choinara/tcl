package com.peakmate.backend.interfaces.email.controller;

import com.peakmate.backend.application.email.EmailClassifyService;
import com.peakmate.backend.application.email.EmailImportService;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.core.common.ApiResponse;
import com.peakmate.core.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailImportController {

    private final EmailImportService importService;
    private final EmailClassifyService classifyService;
    private final SystemLogService systemLogService;

    @RequirePermission(menu = "EM0010", action = "create")
    @PostMapping("/import")
    public ApiResponse<Map<String, Object>> importEmails() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        importService.pollNewEmails();

        String message = "IMAP 폴링 트리거 완료 (결과는 서버 로그 참조)";
        try {
            systemLogService.log("DATA_IMPORT", null, currentUser, null, "이메일 IMAP 폴링 수동 트리거", message);
        } catch (Exception e) {
            log.warn("이메일 가져오기 시스템 로그 기록 실패: {}", e.getMessage());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        return ApiResponse.success(response);
    }

    @RequirePermission(menu = "EM0010", action = "create")
    @PostMapping("/classify")
    public ApiResponse<Map<String, Object>> classifyEmails() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        EmailClassifyService.ClassifyResult result = classifyService.classifyPendingEmails();

        String message = String.format("완료: %d건 분류됨, %d건 미배정, %d건 실패",
                result.classified(), result.unassigned(), result.failed());
        try {
            systemLogService.log("DATA_IMPORT", null, currentUser, null, "이메일 AI 분류", message);
        } catch (Exception e) {
            log.warn("이메일 AI 분류 시스템 로그 기록 실패: {}", e.getMessage());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", result.total());
        response.put("classified", result.classified());
        response.put("unassigned", result.unassigned());
        response.put("failed", result.failed());
        response.put("message", message);
        return ApiResponse.success(response);
    }
}
