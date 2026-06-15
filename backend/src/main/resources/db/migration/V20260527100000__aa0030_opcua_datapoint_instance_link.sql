-- AA0030 데이터 수집 설정 재설계: opcua_data_point에 인스턴스 연결 + engineering CSV 컬럼 추가
ALTER TABLE opcua_data_point
    ADD COLUMN asset_instance_id BIGINT,
    ADD COLUMN edge_name         VARCHAR(50),
    ADD COLUMN equip_name        VARCHAR(100),
    ADD COLUMN array_index       INTEGER DEFAULT -1;

-- asset_instance FK (논리적 참조, FK 제약 없음 — PeakMate 정책)
COMMENT ON COLUMN opcua_data_point.asset_instance_id IS 'asset_instance.seq_id 참조 (논리 FK)';
COMMENT ON COLUMN opcua_data_point.edge_name IS 'engineering CSV EdgeName (EDGE-01, EDGE-02)';
COMMENT ON COLUMN opcua_data_point.equip_name IS 'engineering CSV EquipmentName (실제 설비명)';
COMMENT ON COLUMN opcua_data_point.array_index IS 'engineering CSV ArrayIndex (기본값 -1: 비배열)';

-- 인스턴스별 조회 성능 인덱스
CREATE INDEX idx_opcua_dp_instance ON opcua_data_point(asset_instance_id);
CREATE INDEX idx_opcua_dp_category ON opcua_data_point(category);
