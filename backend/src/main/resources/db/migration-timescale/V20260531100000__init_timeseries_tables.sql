-- OPC-UA 수집 로그 (시계열)
CREATE TABLE IF NOT EXISTS opcua_ingest_log (
    id           BIGSERIAL,
    edge_id      TEXT        NOT NULL,
    node_id      TEXT        NOT NULL,
    value        TEXT,
    data_type    TEXT,
    quality      TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('opcua_ingest_log', 'collected_at', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_opcua_log_edge_time  ON opcua_ingest_log (edge_id,  collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_opcua_log_node_time  ON opcua_ingest_log (node_id,  collected_at DESC);

-- Vision 수집 로그 (시계열)
CREATE TABLE IF NOT EXISTS vision_ingest_log (
    id           BIGSERIAL,
    edge_id      TEXT        NOT NULL,
    file_name    TEXT,
    result       TEXT,
    defect_type  TEXT,
    image_path   TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('vision_ingest_log', 'collected_at', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_vision_log_edge_time ON vision_ingest_log (edge_id, collected_at DESC);

-- 엣지 서버 Heartbeat (시계열)
CREATE TABLE IF NOT EXISTS opcua_edge_heartbeat (
    id           BIGSERIAL,
    edge_id      TEXT        NOT NULL,
    status       TEXT        NOT NULL,
    message      TEXT,
    node_count   INTEGER,
    heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('opcua_edge_heartbeat', 'heartbeat_at', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_heartbeat_edge_time  ON opcua_edge_heartbeat (edge_id, heartbeat_at DESC);
