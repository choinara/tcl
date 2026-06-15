-- ============================================================
-- V20260525000000: AAS Phase 1 재설계 롤백 (de872c6 이전으로 복원)
-- ============================================================

-- 1. Phase 1 신규 테이블 삭제 (CASCADE)
DROP TABLE IF EXISTS deployment_history CASCADE;
DROP TABLE IF EXISTS edge_equipment CASCADE;
DROP TABLE IF EXISTS edge_gateway CASCADE;
DROP TABLE IF EXISTS engineering_mapping CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;

-- 2. asset_type 복원
CREATE TABLE IF NOT EXISTS asset_type (
    seq_id          BIGSERIAL PRIMARY KEY,
    type_code       VARCHAR(50) UNIQUE NOT NULL,
    type_name       VARCHAR(255) NOT NULL,
    shell_id        VARCHAR(500),
    description     TEXT,
    field_schema    JSONB,
    use_yn          CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_asset_type_code ON asset_type (type_code);

-- 3. asset_instance 복원
CREATE TABLE IF NOT EXISTS asset_instance (
    seq_id          BIGSERIAL PRIMARY KEY,
    instance_id     VARCHAR(50) UNIQUE NOT NULL,
    instance_name   VARCHAR(255) NOT NULL,
    type_code       VARCHAR(50) NOT NULL,
    location_floor  VARCHAR(20),
    serial_number   VARCHAR(100),
    status          VARCHAR(20),
    opcua_node_count INT,
    extra_fields    JSONB,
    use_yn          CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_asset_instance_type ON asset_instance (type_code);
CREATE INDEX IF NOT EXISTS idx_asset_instance_status ON asset_instance (status);

-- 4. data_source 복원 (V22 기반)
CREATE TABLE IF NOT EXISTS data_source (
    seq_id              BIGSERIAL PRIMARY KEY,
    source_id           VARCHAR(50) UNIQUE NOT NULL,
    source_name         VARCHAR(255) NOT NULL,
    source_type         VARCHAR(30) NOT NULL,
    plc_protocol        VARCHAR(50),
    plc_ip              VARCHAR(255),
    plc_port            INT,
    vision_watch_folder VARCHAR(500),
    vision_csv_pattern  VARCHAR(255),
    status              VARCHAR(20) DEFAULT 'ACTIVE',
    last_connected_at   TIMESTAMP,
    use_yn              CHAR(1) DEFAULT 'Y',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_data_source_type ON data_source (source_type);

-- 5. opcua_data_point 복원 (V22 기반)
CREATE TABLE IF NOT EXISTS opcua_data_point (
    seq_id              BIGSERIAL PRIMARY KEY,
    node_id             VARCHAR(100) UNIQUE NOT NULL,
    browse_name         VARCHAR(255) NOT NULL,
    display_name        VARCHAR(255),
    korean_name         VARCHAR(255),
    category            VARCHAR(50),
    node_class          VARCHAR(50) DEFAULT 'Variable',
    data_type           VARCHAR(50),
    unit                VARCHAR(50),
    source_id           VARCHAR(50) REFERENCES data_source(source_id),
    plc_address         VARCHAR(100),
    sampling_ms         INT DEFAULT 1000,
    channel             VARCHAR(30),
    scale_factor        DECIMAL(10,4) DEFAULT 1.0,
    offset_value        DECIMAL(10,4) DEFAULT 0.0,
    polling_enabled     CHAR(1) DEFAULT 'Y',
    is_published        CHAR(1) DEFAULT 'N',
    last_value          VARCHAR(255),
    last_updated        TIMESTAMP,
    aas_path            VARCHAR(500),
    aas_linked          CHAR(1) DEFAULT 'N',
    source_type         VARCHAR(30),
    aas_property_path   VARCHAR(500),
    vision_csv_column   VARCHAR(255),
    is_active           CHAR(1) DEFAULT 'Y',
    parent_node_id      VARCHAR(100),
    use_yn              CHAR(1) DEFAULT 'Y',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_opcua_dp_category ON opcua_data_point (category);
CREATE INDEX IF NOT EXISTS idx_opcua_dp_source ON opcua_data_point (source_id);
CREATE INDEX IF NOT EXISTS idx_opcua_dp_aas ON opcua_data_point (aas_linked);

-- 6. collection_channel 복원
CREATE TABLE IF NOT EXISTS collection_channel (
    seq_id          BIGSERIAL PRIMARY KEY,
    channel_id      VARCHAR(50) UNIQUE NOT NULL,
    channel_name    VARCHAR(100) NOT NULL,
    is_active       CHAR(1) DEFAULT 'N',
    collected_count BIGINT DEFAULT 0,
    last_collected  TIMESTAMP,
    use_yn          CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_collection_channel_id ON collection_channel (channel_id);

-- 7. collection_item 복원
CREATE TABLE IF NOT EXISTS collection_item (
    seq_id      BIGSERIAL PRIMARY KEY,
    channel_id  VARCHAR(50) NOT NULL REFERENCES collection_channel(channel_id) ON DELETE CASCADE,
    node_id     VARCHAR(100) NOT NULL REFERENCES opcua_data_point(node_id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_collection_item UNIQUE (channel_id, node_id)
);
CREATE INDEX IF NOT EXISTS idx_collection_item_channel ON collection_item (channel_id);

-- 8. collected_data 복원
CREATE TABLE IF NOT EXISTS collected_data (
    seq_id          BIGSERIAL PRIMARY KEY,
    node_id         VARCHAR(100) NOT NULL,
    channel_id      VARCHAR(50),
    value           VARCHAR(255),
    collected_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_collected_data_node ON collected_data (node_id);
CREATE INDEX IF NOT EXISTS idx_collected_data_time ON collected_data (collected_at DESC);

-- 9. aas_linkage 복원 (V23 기반)
CREATE TABLE IF NOT EXISTS aas_linkage (
    seq_id      BIGSERIAL PRIMARY KEY,
    node_id     VARCHAR(100) NOT NULL,
    element_id  BIGINT NOT NULL,
    aas_path    VARCHAR(500),
    linked_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_aas_linkage_node UNIQUE (node_id),
    CONSTRAINT fk_linkage_node    FOREIGN KEY (node_id)    REFERENCES opcua_data_point(node_id) ON DELETE CASCADE,
    CONSTRAINT fk_linkage_element FOREIGN KEY (element_id) REFERENCES aas_element(seq_id)       ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_aas_linkage_element ON aas_linkage (element_id);

-- 10. system_menu 경로/이름 원복
UPDATE system_menu SET menu_name='Asset Instance 관리', menu_path='/aas/instances'  WHERE menu_code='AA0020';
UPDATE system_menu SET menu_name='데이터 수집 설정',   menu_path='/aas/collection' WHERE menu_code='AA0030';
UPDATE system_menu SET menu_name='데이터 연결',         menu_path='/aas/connection'  WHERE menu_code='AA0040';
UPDATE system_menu SET menu_name='매핑 관리',           menu_path='/opcua/mapping'   WHERE menu_code='AA0050';
UPDATE system_menu SET menu_name='AAS 연계',            menu_path='/aas/linkage'     WHERE menu_code='AA0060';
