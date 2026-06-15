package com.peakmate.backend.domain.aas.entity;

import com.peakmate.core.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 엣지 서버별 최신 하트비트 상태 (1 edge = 1 row, upsert 방식).
 */
@Getter
@Entity
@Table(name = "opcua_edge_last_heartbeat")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpcuaEdgeLastHeartbeat extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "edge_id", nullable = false, unique = true, length = 100)
    private String edgeId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "ingest_count_1m", nullable = false)
    private int ingestCount1m;

    @Column(name = "bridge_status", length = 50)
    private String bridgeStatus;

    @Column(name = "uptime_sec", nullable = false)
    private long uptimeSec;

    @Column(name = "heartbeat_at", nullable = false)
    private LocalDateTime heartbeatAt;

    public static OpcuaEdgeLastHeartbeat create(
            String edgeId, String status, int ingestCount1m,
            String bridgeStatus, long uptimeSec) {
        OpcuaEdgeLastHeartbeat e = new OpcuaEdgeLastHeartbeat();
        e.edgeId = edgeId;
        e.status = status;
        e.ingestCount1m = ingestCount1m;
        e.bridgeStatus = bridgeStatus;
        e.uptimeSec = uptimeSec;
        e.heartbeatAt = LocalDateTime.now();
        return e;
    }

    public void update(String status, int ingestCount1m, String bridgeStatus, long uptimeSec) {
        this.status = status;
        this.ingestCount1m = ingestCount1m;
        this.bridgeStatus = bridgeStatus;
        this.uptimeSec = uptimeSec;
        this.heartbeatAt = LocalDateTime.now();
    }
}
