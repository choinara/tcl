package com.peakmate.backend.domain.auth.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

/**
 * 개인정보 처리 감사 로그 엔티티.
 */
@Getter
@Entity
@Table(name = "pii_audit_log")
public class PiiAuditLog extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "target_table", length = 100)
    private String targetTable;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "field_name", length = 100)
    private String fieldName;

    @Column(name = "actor_username", nullable = false, length = 50)
    private String actorUsername;

    @Column(name = "actor_ip", length = 45)
    private String actorIp;

    @Column(name = "detail", length = 500)
    private String detail;

    protected PiiAuditLog() {}

    public static PiiAuditLog create(String eventType, String targetTable, Long targetId,
                                      String fieldName, String actorUsername, String actorIp, String detail) {
        PiiAuditLog log = new PiiAuditLog();
        log.eventType = eventType;
        log.targetTable = targetTable;
        log.targetId = targetId;
        log.fieldName = fieldName;
        log.actorUsername = actorUsername;
        log.actorIp = actorIp;
        log.detail = detail;
        return log;
    }
}
