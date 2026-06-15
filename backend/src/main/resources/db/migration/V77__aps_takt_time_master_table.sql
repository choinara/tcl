-- APS Takt time 마스터 테이블
CREATE TABLE aps_takt_time_master (
    seq_id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    line_code           VARCHAR(20)     NOT NULL,
    product_code        VARCHAR(30)     NOT NULL,
    takt_time_min_per_kg NUMERIC(8,4)  NOT NULL,
    min_worker_count    INT             NOT NULL DEFAULT 1,
    is_active           CHAR(1)         NOT NULL DEFAULT 'Y',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(50),
    updated_by          VARCHAR(50),
    UNIQUE (line_code, product_code)
);
