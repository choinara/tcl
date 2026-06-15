-- ============================================================================
-- AA0031 DataSource 계층구조 개선
-- data_source.asset_instance_id 추가 + FK ON DELETE SET NULL 재선언
-- ============================================================================

-- 1. data_source에 asset_instance_id 컬럼 추가
ALTER TABLE data_source
    ADD COLUMN IF NOT EXISTS asset_instance_id BIGINT;

-- 2. asset_instance_code → asset_instance_id, asset_instance_name 데이터 마이그레이션
-- (data_source 0건 시 no-op, 데이터 존재 시 instance_id → seq_id 매핑)
UPDATE data_source ds
SET asset_instance_id   = ai.seq_id,
    asset_instance_name = ai.instance_name
FROM asset_instance ai
WHERE ds.asset_instance_code = ai.instance_id
  AND ds.asset_instance_id IS NULL;

-- 3. opcua_data_point.source_id FK ON DELETE SET NULL 재선언
-- 기존 FK 삭제 (V22 DDL 자동 생성 명칭 확인 완료: opcua_data_point_source_id_fkey)
ALTER TABLE opcua_data_point
    DROP CONSTRAINT IF EXISTS opcua_data_point_source_id_fkey;
ALTER TABLE opcua_data_point
    ADD CONSTRAINT opcua_data_point_source_id_fkey
        FOREIGN KEY (source_id)
        REFERENCES data_source(source_id)
        ON DELETE SET NULL;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_data_source_asset_instance_id
    ON data_source(asset_instance_id);
