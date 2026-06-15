-- 기준정보 마스터에 고유 비즈니스 코드 컬럼 추가

-- master_supplier에 supplier_code 추가
ALTER TABLE master_supplier ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_code ON master_supplier(supplier_code) WHERE supplier_code IS NOT NULL;

-- master_raw_material에 material_code 추가
ALTER TABLE master_raw_material ADD COLUMN IF NOT EXISTS material_code VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_material_code ON master_raw_material(material_code) WHERE material_code IS NOT NULL;

-- 기존 시드 데이터 코드 업데이트 (원자재: model_name을 코드로 활용)
UPDATE master_raw_material SET material_code = model_name WHERE material_code IS NULL;
-- 협력업체: 약칭 기반 코드 부여
UPDATE master_supplier SET supplier_code = 'SUP-' || LPAD(seq_id::text, 3, '0') WHERE supplier_code IS NULL;
