-- APS 배정 결과 테이블
CREATE TABLE aps_schedule_draft (
    seq_id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plan_id             BIGINT          NOT NULL,
    line_code           VARCHAR(20)     NOT NULL,
    plan_date           DATE            NOT NULL,
    shift               VARCHAR(20)     NOT NULL,
    crew                VARCHAR(20),
    worker_count        INT             NOT NULL DEFAULT 0,
    product_code        VARCHAR(30)     NOT NULL,
    planned_qty         NUMERIC(12,3)   NOT NULL DEFAULT 0,
    takt_time           NUMERIC(8,4),
    start_time          TIMESTAMP,
    end_time            TIMESTAMP,
    sort_order          INT             NOT NULL DEFAULT 0,
    remark              TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(50),
    updated_by          VARCHAR(50)
);

CREATE INDEX idx_aps_draft_plan ON aps_schedule_draft (plan_id);
CREATE INDEX idx_aps_draft_query ON aps_schedule_draft (plan_id, line_code, plan_date);

-- APS 투입자재 LOT 테이블
CREATE TABLE aps_schedule_lot (
    seq_id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    schedule_draft_id   BIGINT          NOT NULL,
    input_lot_id        VARCHAR(50)     NOT NULL,
    input_material_code VARCHAR(30),
    input_qty           NUMERIC(12,3)   NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(50),
    updated_by          VARCHAR(50)
);

CREATE INDEX idx_aps_lot_draft ON aps_schedule_lot (schedule_draft_id);
