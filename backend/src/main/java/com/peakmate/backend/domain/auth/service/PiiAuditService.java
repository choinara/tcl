package com.peakmate.backend.domain.auth.service;

import com.peakmate.backend.domain.auth.entity.PiiAuditLog;
import com.peakmate.backend.domain.auth.repository.PiiAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 개인정보 처리 감사 로깅 서비스.
 * 개인정보 조회/수정/삭제/내보내기 이벤트를 비동기로 기록합니다.
 */
@Service
@RequiredArgsConstructor
public class PiiAuditService {

    private final PiiAuditLogRepository piiAuditLogRepository;

    @Async
    @Transactional
    public void log(String eventType, String targetTable, Long targetId,
                    String fieldName, String actorUsername, String actorIp, String detail) {
        PiiAuditLog auditLog = PiiAuditLog.create(
                eventType, targetTable, targetId, fieldName, actorUsername, actorIp, detail);
        piiAuditLogRepository.save(auditLog);
    }

    @Async
    @Transactional
    public void logView(String targetTable, Long targetId, String actorUsername, String actorIp) {
        log("VIEW", targetTable, targetId, null, actorUsername, actorIp, "개인정보 조회");
    }

    @Async
    @Transactional
    public void logExport(String targetTable, String actorUsername, String actorIp, String detail) {
        log("EXPORT", targetTable, null, null, actorUsername, actorIp, detail);
    }

    @Async
    @Transactional
    public void logModify(String targetTable, Long targetId, String fieldName,
                          String actorUsername, String actorIp) {
        log("MODIFY", targetTable, targetId, fieldName, actorUsername, actorIp, "개인정보 수정");
    }

    @Async
    @Transactional
    public void logDelete(String targetTable, Long targetId, String actorUsername, String actorIp) {
        log("DELETE", targetTable, targetId, null, actorUsername, actorIp, "개인정보 삭제");
    }

    @Async
    @Transactional
    public void logAnonymize(String targetTable, Long targetId, String actorUsername) {
        log("ANONYMIZE", targetTable, targetId, null, actorUsername, null, "개인정보 익명화");
    }
}
