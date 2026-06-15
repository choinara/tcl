package com.peakmate.backend.domain.preference.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

/**
 * 관리자 사용자 환경설정 엔티티.
 * adminUserId는 ADMIN_USER.SEQ_ID를 논리적 FK로 참조합니다. (물리적 FK 없음)
 */
@Getter
@Entity
@Table(name = "user_preference")
public class UserPreference extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    /**
     * FK -> ADMIN_USER.SEQ_ID (논리적 참조)
     */
    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "pref_key", nullable = false, length = 100)
    private String prefKey;

    @Lob
    @Column(name = "pref_value", columnDefinition = "TEXT")
    private String prefValue;

    /**
     * 새 환경설정 항목을 생성합니다.
     */
    public static UserPreference of(Long adminUserId, String key, String value) {
        UserPreference pref = new UserPreference();
        pref.adminUserId = adminUserId;
        pref.prefKey = key;
        pref.prefValue = value;
        return pref;
    }

    /**
     * 환경설정 값을 업데이트합니다.
     */
    public void updateValue(String value) {
        this.prefValue = value;
    }
}
