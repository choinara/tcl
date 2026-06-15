package com.peakmate.backend.domain.i18n.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Entity
@Table(name = "i18n_message",
        uniqueConstraints = @UniqueConstraint(columnNames = {"lang_code", "message_key"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class I18nMessage extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "lang_code", nullable = false, length = 10)
    private String langCode;

    @Column(name = "message_key", nullable = false, length = 500)
    private String messageKey;

    @Column(name = "message_value", columnDefinition = "TEXT")
    private String messageValue;

    @ColumnDefault("'Y'")
    @Column(name = "is_active", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Builder
    private I18nMessage(String langCode, String messageKey, String messageValue,
                        String isActive) {
        this.langCode = langCode;
        this.messageKey = messageKey;
        this.messageValue = messageValue;
        this.isActive = isActive;
    }

    public static I18nMessage create(String langCode, String messageKey, String messageValue) {
        return I18nMessage.builder()
                .langCode(langCode)
                .messageKey(messageKey)
                .messageValue(messageValue)
                .isActive("Y")
                .build();
    }

    public void updateValue(String messageValue) {
        this.messageValue = messageValue;
    }
}
