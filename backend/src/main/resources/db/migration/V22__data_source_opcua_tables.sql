-- ============================================================
-- V22: Data Source + OPC-UA Data Point + Collection Item 테이블
-- ============================================================

-- 데이터소스 (PLC, Vision, Database)
CREATE TABLE IF NOT EXISTS data_source (
    seq_id              BIGSERIAL PRIMARY KEY,
    source_id           VARCHAR(50) UNIQUE NOT NULL,
    source_name         VARCHAR(255) NOT NULL,
    source_type         VARCHAR(30) NOT NULL,        -- plc, vision, database
    plc_protocol        VARCHAR(50),                 -- melsec, modbus, siemens
    plc_ip              VARCHAR(255),
    plc_port            INT,
    vision_watch_folder VARCHAR(500),
    vision_csv_pattern  VARCHAR(255),
    status              VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, ERROR
    last_connected_at   TIMESTAMP,
    use_yn              CHAR(1) DEFAULT 'Y',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OPC-UA 데이터 포인트 (매핑 + 노드 통합)
CREATE TABLE IF NOT EXISTS opcua_data_point (
    seq_id              BIGSERIAL PRIMARY KEY,
    node_id             VARCHAR(100) UNIQUE NOT NULL,
    browse_name         VARCHAR(255) NOT NULL,
    display_name        VARCHAR(255),
    korean_name         VARCHAR(255),
    category            VARCHAR(50),                 -- Temperature, Time, Vision, Pressure, VisionNG
    node_class          VARCHAR(50) DEFAULT 'Variable',
    data_type           VARCHAR(50),
    unit                VARCHAR(50),
    source_id           VARCHAR(50) REFERENCES data_source(source_id),
    plc_address         VARCHAR(100),
    sampling_ms         INT DEFAULT 1000,
    channel             VARCHAR(30),                 -- plc_100ms, plc_1s
    scale_factor        DECIMAL(10,4) DEFAULT 1.0,
    offset_value        DECIMAL(10,4) DEFAULT 0.0,
    polling_enabled     CHAR(1) DEFAULT 'Y',
    is_published        CHAR(1) DEFAULT 'N',
    last_value          VARCHAR(255),
    last_updated        TIMESTAMP,
    aas_path            VARCHAR(500),
    aas_linked          CHAR(1) DEFAULT 'N',
    source_type         VARCHAR(30),                 -- aas_property, plc_direct, vision, manual
    aas_property_path   VARCHAR(500),
    vision_csv_column   VARCHAR(255),
    is_active           CHAR(1) DEFAULT 'Y',
    parent_node_id      VARCHAR(100),
    use_yn              CHAR(1) DEFAULT 'Y',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_data_source_type ON data_source (source_type);
CREATE INDEX IF NOT EXISTS idx_opcua_dp_category ON opcua_data_point (category);
CREATE INDEX IF NOT EXISTS idx_opcua_dp_source ON opcua_data_point (source_id);
CREATE INDEX IF NOT EXISTS idx_opcua_dp_aas ON opcua_data_point (aas_linked);
