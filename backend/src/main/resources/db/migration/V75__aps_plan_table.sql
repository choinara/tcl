-- APS 계획 마스터 테이블
CREATE TABLE aps_plan (
    seq_id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    period_start    DATE            NOT NULL,
    period_end      DATE            NOT NULL,
    line_codes      VARCHAR(500)    NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    version         BIGINT          NOT NULL DEFAULT 0,
    remark          TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(50),
    updated_by      VARCHAR(50)
);

CREATE INDEX idx_aps_plan_status ON aps_plan (status);
CREATE INDEX idx_aps_plan_period ON aps_plan (period_start, period_end);
