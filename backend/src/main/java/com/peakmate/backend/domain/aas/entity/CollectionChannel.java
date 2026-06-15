package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

/**
 * 수집 채널 엔티티 (plc_1s, plc_100ms 등)
 */
@Getter
@Entity
@Table(name = "collection_channel")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionChannel extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id", nullable = false)
    private Long id;

    @Column(name = "channel_id", nullable = false, length = 50, unique = true)
    private String channelId;

    @Column(name = "channel_name", nullable = false, length = 100)
    private String channelName;

    @ColumnDefault("'N'")
    @Column(name = "is_active", length = 1, columnDefinition = "CHAR(1)")
    private String isActive;

    @Column(name = "collected_count")
    private Long collectedCount;

    @Column(name = "last_collected")
    private LocalDateTime lastCollected;

    @ColumnDefault("'Y'")
    @Column(name = "use_yn", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String useYn;

    @Builder
    private CollectionChannel(String channelId, String channelName, String isActive,
                              Long collectedCount, LocalDateTime lastCollected,
                              String useYn) {
        this.channelId = channelId;
        this.channelName = channelName;
        this.isActive = isActive;
        this.collectedCount = collectedCount;
        this.lastCollected = lastCollected;
        this.useYn = useYn;
    }

    public static CollectionChannel create(String channelId, String channelName) {
        return CollectionChannel.builder()
                .channelId(channelId)
                .channelName(channelName)
                .isActive("N")
                .collectedCount(0L)
                .useYn("Y")
                .build();
    }

    public void toggleActive() {
        this.isActive = "Y".equals(this.isActive) ? "N" : "Y";
    }

    public void incrementCount() {
        this.collectedCount = (this.collectedCount != null ? this.collectedCount : 0) + 1;
        this.lastCollected = LocalDateTime.now();
    }
}
