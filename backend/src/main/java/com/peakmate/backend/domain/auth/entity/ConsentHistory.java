package com.peakmate.backend.domain.auth.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 개인정보 수집/이용 동의 이력 엔티티.
 */
@Getter
@Entity
@Table(name = "consent_history")
public class ConsentHistory extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "consent_type", nullable = false, length = 50)
    private String consentType;

    @Column(name = "consent_version", nullable = false, length = 20)
    private String consentVersion;

    @Column(name = "consented", nullable = false)
    private boolean consented;

    @Column(name = "consented_at", nullable = false)
    private LocalDateTime consentedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    protected ConsentHistory() {}

    public static ConsentHistory create(Long userId, String consentType, String consentVersion,
                                         boolean consented, String ipAddress, String userAgent) {
        ConsentHistory history = new ConsentHistory();
        history.userId = userId;
        history.consentType = consentType;
        history.consentVersion = consentVersion;
        history.consented = consented;
        history.consentedAt = LocalDateTime.now();
        history.ipAddress = ipAddress;
        history.userAgent = userAgent;
        return history;
    }
}
