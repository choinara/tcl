package com.peakmate.backend.domain.notification.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 시스템 공지(알림) 엔티티.
 * 관리자가 등록하는 기간 기반 공지사항입니다.
 * FK -> ADMIN_USER.SEQ_ID (createdBy)
 */
@Getter
@Entity
@Table(name = "system_notification")
public class SystemNotification extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Size(max = 200)
    @NotNull
    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Size(max = 2000)
    @NotNull
    @Column(name = "content", length = 2000, nullable = false)
    private String content;

    /** 공지 유형 (예: NOTICE, MAINTENANCE, UPDATE 등) */
    @Size(max = 20)
    @NotNull
    @Column(name = "noti_type", length = 20, nullable = false)
    private String notiType;

    /** 공지 시작 일시 */
    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    /** 공지 종료 일시 (null이면 무기한) */
    @Column(name = "end_date")
    private LocalDateTime endDate;

    /** 사용 여부 (Y/N) */
    @Size(max = 1)
    @NotNull
    @Column(name = "use_yn", length = 1, columnDefinition = "CHAR(1)", nullable = false)
    private String useYn;

    public static SystemNotification create(String message, boolean active,
                                            LocalDateTime startAt, LocalDateTime endAt) {
        SystemNotification n = new SystemNotification();
        n.title = message;
        n.content = message;
        n.notiType = "NOTICE";
        n.useYn = active ? "Y" : "N";
        n.startDate = startAt != null ? startAt : LocalDateTime.now();
        n.endDate = endAt;
        return n;
    }

    public void update(String message, boolean active, LocalDateTime startAt, LocalDateTime endAt) {
        this.title = message;
        this.content = message;
        this.useYn = active ? "Y" : "N";
        if (startAt != null) this.startDate = startAt;
        this.endDate = endAt;
    }
}
