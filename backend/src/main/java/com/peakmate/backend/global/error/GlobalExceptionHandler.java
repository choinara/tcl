package com.peakmate.backend.global.error;

import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.core.error.BaseExceptionHandler;
import com.peakmate.core.error.CommonErrorCode;
import com.peakmate.core.error.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * PeakMate 전용 예외 핸들러.
 * 공통 예외 핸들러는 BaseExceptionHandler(core-be)에서 처리.
 * 여기서는 catch-all Exception 핸들러만 구현 (SystemLogService 의존).
 */
@ControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler extends BaseExceptionHandler {

    private final SystemLogService systemLogService;

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("처리되지 않은 예외 발생", e);

        String username = "unknown";
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) username = auth.getName();
        } catch (Exception ignored) { /* 인증 정보 조회 실패 — "unknown"으로 대체 */ }
        try {
            systemLogService.log("ERROR", null, username, null, "처리되지 않은 예외",
                e.getClass().getSimpleName() + ": " + e.getMessage());
        } catch (Exception logEx) {
            log.warn("[시스템 로그 기록 실패] ERROR", logEx);
        }

        final ErrorResponse response = ErrorResponse.of(CommonErrorCode.INTERNAL_SERVER_ERROR);
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
