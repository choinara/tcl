-- ============================================================
-- Phase 4: 수집 채널 + 수집 데이터
-- ============================================================

-- 수집 채널 (plc_100ms, plc_1s 등)
CREATE TABLE IF NOT EXISTS collection_channel (
    seq_id          BIGSERIAL PRIMARY KEY,
    channel_id      VARCHAR(50) UNIQUE NOT NULL,
    channel_name    VARCHAR(100) NOT NULL,
    is_active       CHAR(1)     DEFAULT 'N',
    collected_count BIGINT      DEFAULT 0,
    last_collected  TIMESTAMP,
    use_yn          CHAR(1)     NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 수집 데이터 (시계열)
CREATE TABLE IF NOT EXISTS collected_data (
    seq_id       BIGSERIAL PRIMARY KEY,
    node_id      VARCHAR(100) NOT NULL,
    channel_id   VARCHAR(50),
    value        VARCHAR(255),
    collected_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collected_data_time ON collected_data (collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_collected_data_node ON collected_data (node_id, collected_at DESC);

-- 기본 채널 시드 데이터
INSERT INTO collection_channel (channel_id, channel_name, is_active, use_yn, created_at, updated_at)
VALUES ('plc_1s', 'PLC 1초 수집', 'N', 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (channel_id) DO NOTHING;

INSERT INTO collection_channel (channel_id, channel_name, is_active, use_yn, created_at, updated_at)
VALUES ('plc_100ms', 'PLC 100ms 수집', 'N', 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (channel_id) DO NOTHING;
