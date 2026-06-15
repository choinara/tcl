package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * TimescaleDB batch INSERT 실패 시 재시도 대기 엔티티.
 * 3회 재시도 실패 후 PENDING 저장, 3분 주기 스케줄러가 재처리.
 * 24시간 초과 시 DEAD 마킹.
 */
@Getter
@Entity
@Table(name = "opcua_batch_pending")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpcuaBatchPending extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_json", nullable = false, columnDefinition = "TEXT")
    private String batchJson;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "last_retry_at")
    private LocalDateTime lastRetryAt;

    @Column(name = "done_at")
    private LocalDateTime doneAt;

    public static OpcuaBatchPending create(String batchJson, String errorMessage) {
        OpcuaBatchPending e = new OpcuaBatchPending();
        e.batchJson = batchJson;
        e.status = "PENDING";
        e.retryCount = 0;
        e.errorMessage = errorMessage;
        return e;
    }

    public void retryFailed(String errorMessage) {
        this.retryCount++;
        this.lastRetryAt = LocalDateTime.now();
        this.errorMessage = errorMessage;
    }

    public void markDone() {
        this.status = "DONE";
        this.doneAt = LocalDateTime.now();
    }

    public void markDead() {
        this.status = "DEAD";
    }
}
