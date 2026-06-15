-- 가입고등록 테이블

CREATE TABLE wh_pre_inbound (
    seq_id          BIGSERIAL PRIMARY KEY,
    lot_no          VARCHAR(100) NOT NULL,
    material_code   VARCHAR(50) NOT NULL,
    material_name   VARCHAR(200),
    pre_inbound_qty DECIMAL(12,2) NOT NULL,
    weight          DECIMAL(12,3),
    supplier_code   VARCHAR(50) NOT NULL,
    supplier_name   VARCHAR(200),
    pre_inbound_date DATE NOT NULL,
    barcode_no      VARCHAR(100),
    po_number       VARCHAR(100),
    status_cd       VARCHAR(20) NOT NULL DEFAULT '가입고',
    approval_cd     VARCHAR(20) NOT NULL DEFAULT '미승인',
    inspect_qty     DECIMAL(12,2),
    diff_qty        DECIMAL(12,2),
    remain_qty      DECIMAL(12,2),
    location_cd     VARCHAR(50),
    remark          TEXT,
    is_active       VARCHAR(1) DEFAULT 'Y',
    created_by      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

-- 인덱스
CREATE UNIQUE INDEX uix_wh_pre_inbound_lot ON wh_pre_inbound(lot_no);
CREATE UNIQUE INDEX uix_wh_pre_inbound_barcode ON wh_pre_inbound(barcode_no) WHERE barcode_no IS NOT NULL;
CREATE INDEX idx_wh_pre_inbound_date ON wh_pre_inbound(pre_inbound_date);
CREATE INDEX idx_wh_pre_inbound_status ON wh_pre_inbound(status_cd, approval_cd);
