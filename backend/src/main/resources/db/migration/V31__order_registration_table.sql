-- 수주등록 테이블
CREATE TABLE order_registration (
    seq_id         BIGSERIAL PRIMARY KEY,
    order_year     INTEGER      NOT NULL,
    order_month    INTEGER      NOT NULL,
    polarity       VARCHAR(10)  NOT NULL,   -- '음극' | '양극'
    site           VARCHAR(10)  NOT NULL,   -- 'MP' | 'SLD'
    spec           VARCHAR(50)  NOT NULL,   -- 규격 (0.2*45)
    material       VARCHAR(50)  NOT NULL,   -- 재질 (일반동, 무산소, 알루미늄)
    category       VARCHAR(50)  NOT NULL DEFAULT 'Demand',
    status         VARCHAR(20)  NOT NULL DEFAULT '접수',
    d1  INTEGER, d2  INTEGER, d3  INTEGER, d4  INTEGER, d5  INTEGER,
    d6  INTEGER, d7  INTEGER, d8  INTEGER, d9  INTEGER, d10 INTEGER,
    d11 INTEGER, d12 INTEGER, d13 INTEGER, d14 INTEGER, d15 INTEGER,
    d16 INTEGER, d17 INTEGER, d18 INTEGER, d19 INTEGER, d20 INTEGER,
    d21 INTEGER, d22 INTEGER, d23 INTEGER, d24 INTEGER, d25 INTEGER,
    d26 INTEGER, d27 INTEGER, d28 INTEGER, d29 INTEGER, d30 INTEGER,
    d31 INTEGER,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- 동일 월/극성/거점/규격/재질 중복 방지
CREATE UNIQUE INDEX uix_order_reg_key
    ON order_registration (order_year, order_month, polarity, site, spec, material);

-- 월별 조회 인덱스
CREATE INDEX idx_order_reg_ym ON order_registration (order_year, order_month);
