package com.peakmate.backend.domain.admin.service;

import com.peakmate.backend.domain.admin.entity.AdminUserSession;
import com.peakmate.backend.domain.admin.repository.AdminUserSessionRepository;
import com.peakmate.backend.domain.log.service.SystemLogService;
import com.peakmate.backend.domain.system.service.SystemSettingService;
import com.peakmate.backend.infra.session.SessionEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 관리자 세션 관리를 담당하는 도메인 서비스.
 * 1인 1세션 정책: 로그인 시 기존 세션 교체 (DB UNIQUE 제약 보장)
 * 단일 로그인 설정(ON): 강제 로그아웃 알림 발송 후 교체
 * 단일 로그인 설정(OFF): 알림 없이 교체
 * 세션 식별: Access Token의 jti(JWT ID, UUID) 사용 (해시 불필요)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserSessionDomainService {

    private final AdminUserSessionRepository adminUserSessionRepository;
    private final SystemSettingService systemSettingService;
    private final SessionEventService sessionEventService;
    private final SystemLogService systemLogService;

    /**
     * 세션 정보(jti 및 만료 일시)를 업데이트합니다.
     * 1인 1세션 정책: 기존 세션 삭제 후 새 세션 생성
     */
    @Transactional
    public void updateSession(Long adminUserId, String jti, LocalDateTime expiresAt) {
        if (systemSettingService.isSingleLoginEnabled()) {
            sessionEventService.sendForceLogout(adminUserId, "다른 기기에서 로그인하여 현재 세션이 종료됩니다.");
            try { String currentUser = SecurityContextHolder.getContext().getAuthentication() != null ? SecurityContextHolder.getContext().getAuthentication().getName() : "SYSTEM"; systemLogService.log("SESSION_FORCE_LOGOUT", adminUserId, currentUser, null, "강제 로그아웃", "단일 로그인 정책에 의한 기존 세션 강제 종료"); } catch (Exception e) { log.warn("[시스템 로그 기록 실패] SESSION_FORCE_LOGOUT", e); }
        }
        adminUserSessionRepository.deleteByAdminUserId(adminUserId);
        adminUserSessionRepository.save(AdminUserSession.create(adminUserId, jti, expiresAt));
    }

    /**
     * 특정 jti의 세션을 삭제합니다. (로그아웃 시 해당 세션만 무효화)
     */
    @Transactional
    public void deleteSessionByJti(String jti) {
        adminUserSessionRepository.deleteByJti(jti);
    }

    /**
     * 사용자의 모든 세션을 삭제합니다. (강제 로그아웃 / 비밀번호 변경 시)
     */
    @Transactional
    public void deleteAllSessions(Long adminUserId) {
        adminUserSessionRepository.deleteByAdminUserId(adminUserId);
    }

    /**
     * 기존 jti의 세션을 새 jti로 교체합니다. (토큰 갱신 시)
     */
    @Transactional
    public void refreshSession(String oldJti, String newJti, LocalDateTime expiresAt) {
        adminUserSessionRepository.findByJti(oldJti)
                .ifPresent(session -> {
                    // 절대 타임아웃: 최초 로그인 후 설정된 시간 초과 시 갱신 거부
                    if (session.getSessionStartedAt() != null
                            && session.getSessionStartedAt().plusHours(getAbsoluteTimeoutHours()).isBefore(LocalDateTime.now())) {
                        throw new IllegalStateException("세션이 만료되었습니다. 다시 로그인하세요.");
                    }
                    session.updateSession(newJti, expiresAt);
                });
    }

    /**
     * 사용자 ID로 현재 세션의 jti를 조회합니다. (Refresh Token 갱신 시 사용)
     */
    @Transactional(readOnly = true)
    public String findJtiByUserId(Long adminUserId) {
        return adminUserSessionRepository.findByAdminUserId(adminUserId)
                .map(AdminUserSession::getJti)
                .orElse(null);
    }

    /**
     * system_setting에서 절대 타임아웃 시간을 조회합니다.
     * 설정값이 없거나 파싱 실패 시 기본값 8시간을 사용합니다.
     */
    private long getAbsoluteTimeoutHours() {
        try {
            String value = systemSettingService.getValue("security.session.absolute-timeout-hours", "8");
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            log.warn("[절대 타임아웃] 설정값 파싱 실패, 기본값 8시간 사용", e);
            return 8L;
        }
    }

    /**
     * 저장된 jti와 요청 jti가 일치하는지 검증합니다.
     */
    @Transactional(readOnly = true)
    public boolean isValidSession(Long adminUserId, String jti) {
        return adminUserSessionRepository.findByJti(jti)
                .map(session -> session.getAdminUserId().equals(adminUserId))
                .orElse(false);
    }
}
