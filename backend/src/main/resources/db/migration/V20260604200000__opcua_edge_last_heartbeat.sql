-- 엣지 서버별 최신 하트비트 단건 저장 (upsert 전용)
CREATE TABLE IF NOT EXISTS opcua_edge_last_heartbeat (
    id               BIGSERIAL PRIMARY KEY,
    edge_id          VARCHAR(100) NOT NULL UNIQUE,
    status           VARCHAR(20)  NOT NULL,
    ingest_count_1m  INTEGER      NOT NULL DEFAULT 0,
    bridge_status    VARCHAR(50),
    uptime_sec       BIGINT       NOT NULL DEFAULT 0,
    heartbeat_at     TIMESTAMP    NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(50),
    updated_by       VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_edge_last_heartbeat_heartbeat_at
    ON opcua_edge_last_heartbeat (heartbeat_at DESC);
