package com.peakmate.backend.domain.bulletin.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "system_bulletin")
public class SystemBulletin extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long id;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "popup_on_login", length = 1, nullable = false)
    private String popupOnLogin = "Y";

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "is_active", length = 1, nullable = false)
    private String isActive = "Y";

    public static SystemBulletin create(String title, String content, boolean popupOnLogin,
                                        LocalDate validFrom, LocalDate validTo,
                                        boolean active) {
        SystemBulletin b = new SystemBulletin();
        b.title = title;
        b.content = content;
        b.popupOnLogin = popupOnLogin ? "Y" : "N";
        b.validFrom = validFrom;
        b.validTo = validTo;
        b.isActive = active ? "Y" : "N";
        return b;
    }

    public void update(String title, String content, boolean popupOnLogin,
                       LocalDate validFrom, LocalDate validTo, boolean active) {
        this.title = title;
        this.content = content;
        this.popupOnLogin = popupOnLogin ? "Y" : "N";
        this.validFrom = validFrom;
        this.validTo = validTo;
        this.isActive = active ? "Y" : "N";
    }

    public void deactivate() {
        this.isActive = "N";
    }
}
