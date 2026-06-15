-- ============================================================
-- V21: Asset Type / Asset Instance 테이블
-- ============================================================

-- Asset Type (자산 유형 정의)
CREATE TABLE IF NOT EXISTS asset_type (
    seq_id          BIGSERIAL PRIMARY KEY,
    type_code       VARCHAR(50) UNIQUE NOT NULL,
    type_name       VARCHAR(255) NOT NULL,
    shell_id        VARCHAR(500),
    description     TEXT,
    field_schema    JSONB DEFAULT '[]',
    use_yn          CHAR(1) DEFAULT 'Y',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Instance (물리 장비 인스턴스)
CREATE TABLE IF NOT EXISTS asset_instance (
    seq_id          BIGSERIAL PRIMARY KEY,
    instance_id     VARCHAR(50) UNIQUE NOT NULL,
    instance_name   VARCHAR(255) NOT NULL,
    type_code       VARCHAR(50) NOT NULL REFERENCES asset_type(type_code),
    location_floor  VARCHAR(20),
    serial_number   VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    opcua_node_count INT DEFAULT 0,
    extra_fields    JSONB DEFAULT '{}',
    use_yn          CHAR(1) DEFAULT 'Y',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_asset_instance_type ON asset_instance (type_code);
CREATE INDEX IF NOT EXISTS idx_asset_instance_status ON asset_instance (status);
