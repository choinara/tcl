-- 일별생산계획 테이블
CREATE TABLE daily_production_plan (
    seq_id          BIGSERIAL PRIMARY KEY,
    plan_year       INTEGER       NOT NULL,
    plan_month      INTEGER       NOT NULL,
    line_code       VARCHAR(10)   NOT NULL,     -- P1, P2, ..., S1, S2
    product_name    VARCHAR(20)   NOT NULL,     -- CQ, AQ, 4C_SK 등
    spec            VARCHAR(50)   NOT NULL,     -- 0.2*45
    material        VARCHAR(50)   NOT NULL,     -- 일반동, 무산소, H0, H14
    plan_type       VARCHAR(10)   NOT NULL DEFAULT '계획',  -- '계획' | '실적'
    sort_order      INTEGER       NOT NULL DEFAULT 0,
    d1  NUMERIC(10,1), d2  NUMERIC(10,1), d3  NUMERIC(10,1),
    d4  NUMERIC(10,1), d5  NUMERIC(10,1), d6  NUMERIC(10,1),
    d7  NUMERIC(10,1), d8  NUMERIC(10,1), d9  NUMERIC(10,1),
    d10 NUMERIC(10,1), d11 NUMERIC(10,1), d12 NUMERIC(10,1),
    d13 NUMERIC(10,1), d14 NUMERIC(10,1), d15 NUMERIC(10,1),
    d16 NUMERIC(10,1), d17 NUMERIC(10,1), d18 NUMERIC(10,1),
    d19 NUMERIC(10,1), d20 NUMERIC(10,1), d21 NUMERIC(10,1),
    d22 NUMERIC(10,1), d23 NUMERIC(10,1), d24 NUMERIC(10,1),
    d25 NUMERIC(10,1), d26 NUMERIC(10,1), d27 NUMERIC(10,1),
    d28 NUMERIC(10,1), d29 NUMERIC(10,1), d30 NUMERIC(10,1),
    d31 NUMERIC(10,1),
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT now()
);

-- 동일 월/line/제품명/규격/재질/구분 중복 방지
CREATE UNIQUE INDEX uix_daily_plan_key
    ON daily_production_plan (plan_year, plan_month, line_code, product_name, spec, material, plan_type);

-- 월별 조회 인덱스
CREATE INDEX idx_daily_plan_ym
    ON daily_production_plan (plan_year, plan_month);
