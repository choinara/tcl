-- ============================================================
-- Phase 1: AAS/OPC-UA 재설계 -- 폐기 + 신규 테이블
-- ============================================================

-- 1. 폐기 (CASCADE 순서)
DROP TABLE IF EXISTS aas_linkage CASCADE;
DROP TABLE IF EXISTS opcua_data_point CASCADE;
DROP TABLE IF EXISTS data_source CASCADE;
DROP TABLE IF EXISTS collection_item CASCADE;
DROP TABLE IF EXISTS collection_channel CASCADE;
DROP TABLE IF EXISTS collected_data CASCADE;
DROP TABLE IF EXISTS asset_instance CASCADE;
DROP TABLE IF EXISTS asset_type CASCADE;
-- opcua_gateway_log는 AA0070 보류이므로 유지

-- 2. equipment (AA0020)
CREATE TABLE IF NOT EXISTS equipment (
    seq_id           BIGSERIAL PRIMARY KEY,
    equipment_code   VARCHAR(50) UNIQUE NOT NULL,
    equipment_name   VARCHAR(255) NOT NULL,
    aasx_type        VARCHAR(10) NOT NULL,
    floor_no         VARCHAR(20),
    line_no          VARCHAR(20),
    slot_no          VARCHAR(20),
    serial_number    VARCHAR(100),
    status           VARCHAR(20) DEFAULT 'ACTIVE',
    use_yn           CHAR(1) DEFAULT 'Y',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100)
);
CREATE INDEX idx_equipment_aasx_type ON equipment(aasx_type);
CREATE INDEX idx_equipment_status ON equipment(status);

-- 3. engineering_mapping (AA0030)
CREATE TABLE IF NOT EXISTS engineering_mapping (
    seq_id               BIGSERIAL PRIMARY KEY,
    equipment_code       VARCHAR(50) NOT NULL,
    aasx_type            VARCHAR(10) NOT NULL,
    aas_path             VARCHAR(500) NOT NULL,
    edge_name            VARCHAR(50),
    node_id              VARCHAR(200),
    node_template        VARCHAR(200),
    sampling_ms          INT DEFAULT 1000,
    array_index          INT DEFAULT -1,
    source_type          VARCHAR(20),
    plc_ip               VARCHAR(100),
    plc_port             INT,
    plc_protocol         VARCHAR(30),
    plc_address          VARCHAR(100),
    vision_watch_folder  VARCHAR(500),
    vision_csv_pattern   VARCHAR(255),
    channel              VARCHAR(30),
    last_value           VARCHAR(255),
    last_collected_at    TIMESTAMP,
    is_active            CHAR(1) DEFAULT 'Y',
    use_yn               CHAR(1) DEFAULT 'Y',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100),
    CONSTRAINT fk_em_equipment FOREIGN KEY (equipment_code)
        REFERENCES equipment(equipment_code) ON DELETE CASCADE
);
CREATE INDEX idx_em_equipment ON engineering_mapping(equipment_code);
CREATE INDEX idx_em_aasx_type ON engineering_mapping(aasx_type);
CREATE INDEX idx_em_edge_name ON engineering_mapping(edge_name);
CREATE INDEX idx_em_active ON engineering_mapping(is_active);

-- 4. edge_gateway (AA0040)
CREATE TABLE IF NOT EXISTS edge_gateway (
    seq_id             BIGSERIAL PRIMARY KEY,
    gateway_code       VARCHAR(50) UNIQUE NOT NULL,
    gateway_name       VARCHAR(255) NOT NULL,
    ip_address         VARCHAR(100),
    port               INT DEFAULT 4840,
    status             VARCHAR(20) DEFAULT 'OFFLINE',
    last_heartbeat_at  TIMESTAMP,
    use_yn             CHAR(1) DEFAULT 'Y',
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100)
);

-- 5. edge_equipment (AA0040)
CREATE TABLE IF NOT EXISTS edge_equipment (
    seq_id           BIGSERIAL PRIMARY KEY,
    gateway_code     VARCHAR(50) NOT NULL,
    equipment_code   VARCHAR(50) NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_edge_equipment UNIQUE (gateway_code, equipment_code),
    CONSTRAINT fk_ee_gateway   FOREIGN KEY (gateway_code)
        REFERENCES edge_gateway(gateway_code) ON DELETE CASCADE,
    CONSTRAINT fk_ee_equipment FOREIGN KEY (equipment_code)
        REFERENCES equipment(equipment_code) ON DELETE CASCADE
);
CREATE INDEX idx_ee_gateway ON edge_equipment(gateway_code);

-- 6. deployment_history (AA0040)
CREATE TABLE IF NOT EXISTS deployment_history (
    seq_id           BIGSERIAL PRIMARY KEY,
    gateway_code     VARCHAR(50) NOT NULL,
    deployed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_by      VARCHAR(100),
    equipment_codes  TEXT,
    status           VARCHAR(20) DEFAULT 'SUCCESS',
    row_count        INT,
    note             TEXT,
    CONSTRAINT fk_dh_gateway FOREIGN KEY (gateway_code)
        REFERENCES edge_gateway(gateway_code) ON DELETE CASCADE
);
CREATE INDEX idx_dh_gateway ON deployment_history(gateway_code);
CREATE INDEX idx_dh_deployed_at ON deployment_history(deployed_at DESC);

-- 7. system_menu 경로/이름 변경
UPDATE system_menu SET menu_name='설비관리',         menu_path='/aas/equipment'  WHERE menu_code='AA0020';
UPDATE system_menu SET menu_name='Engineering 매핑', menu_path='/aas/engineering' WHERE menu_code='AA0030';
UPDATE system_menu SET menu_name='Edge Gateway 관리',menu_path='/aas/gateway'     WHERE menu_code='AA0040';
UPDATE system_menu SET menu_name='수집 모니터링',    menu_path='/aas/monitor2'   WHERE menu_code='AA0050';
UPDATE system_menu SET menu_name='수집 데이터 조회', menu_path='/aas/dataview'   WHERE menu_code='AA0060';
