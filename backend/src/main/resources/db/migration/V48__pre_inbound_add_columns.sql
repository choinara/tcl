-- 메탈원자재입출고 항목 보완: 가입고 단계에서 필요한 7개 컬럼 추가
-- 기존 데이터 영향: 모든 컬럼 nullable → 기존 행 NULL 유지, 하위 호환

-- 마스터 참조 캐시 필드 (materialCode 선택 시 자동입력, DB 저장)
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS material_type  VARCHAR(100);
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS product_spec   VARCHAR(200);
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS raw_material   VARCHAR(200);
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS hardness_type  VARCHAR(50);

-- 입고 업무 필드 (수동입력)
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS inbound_time   VARCHAR(5);
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS inbound_source VARCHAR(100);
ALTER TABLE wh_pre_inbound ADD COLUMN IF NOT EXISTS pallet_no      VARCHAR(50);
