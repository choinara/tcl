package com.peakmate.backend.domain.log.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "system_log")
public class SystemLog extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "log_type", length = 30, nullable = false)
    private String logType;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "action", length = 200)
    private String action;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    public static SystemLog create(String logType, Long userId, String username,
                                   String ipAddress, String action, String detail) {
        SystemLog log = new SystemLog();
        log.logType = logType;
        log.userId = userId;
        log.username = username;
        log.ipAddress = ipAddress;
        log.action = action;
        log.detail = detail;
        return log;
    }
}
