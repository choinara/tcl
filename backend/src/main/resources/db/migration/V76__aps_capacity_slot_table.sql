-- APS 호기별 가용능력 테이블
CREATE TABLE aps_capacity_slot (
    seq_id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    line_code       VARCHAR(20)     NOT NULL,
    slot_date       DATE            NOT NULL,
    shift           VARCHAR(20)     NOT NULL,
    crew            VARCHAR(20),
    worker_count    INT             NOT NULL DEFAULT 0,
    avail_hours     NUMERIC(6,2)    NOT NULL DEFAULT 0,
    avail_weight_kg NUMERIC(12,3)   NOT NULL DEFAULT 0,
    is_active       CHAR(1)         NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(50),
    updated_by      VARCHAR(50),
    UNIQUE (line_code, slot_date, shift)
);
