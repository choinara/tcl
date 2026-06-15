-- opcua_batch_pending: TimescaleDB INSERT 실패 시 재시도 대기 테이블
CREATE TABLE opcua_batch_pending (
    id             BIGSERIAL     PRIMARY KEY,
    batch_json     TEXT          NOT NULL,
    status         VARCHAR(10)   NOT NULL DEFAULT 'PENDING',
    retry_count    INTEGER       NOT NULL DEFAULT 0,
    error_message  TEXT,
    last_retry_at  TIMESTAMPTZ,
    done_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by     VARCHAR(50),
    updated_by     VARCHAR(50)
);
CREATE INDEX idx_opcua_pending_status ON opcua_batch_pending (status, created_at);
