package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 수집 데이터 엔티티 (시계열)
 */
@Getter
@Entity
@Table(name = "collected_data")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectedData extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "node_id", nullable = false, length = 100)
    private String nodeId;

    @Column(name = "channel_id", length = 50)
    private String channelId;

    @Column(name = "value", length = 255)
    private String value;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @Builder
    private CollectedData(String nodeId, String channelId, String value, LocalDateTime collectedAt) {
        this.nodeId = nodeId;
        this.channelId = channelId;
        this.value = value;
        this.collectedAt = collectedAt;
    }

    public static CollectedData create(String nodeId, String channelId, String value) {
        return CollectedData.builder()
                .nodeId(nodeId)
                .channelId(channelId)
                .value(value)
                .collectedAt(LocalDateTime.now())
                .build();
    }
}
