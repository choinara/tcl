-- master_equipment 컬럼 확장
ALTER TABLE master_equipment
  ADD COLUMN IF NOT EXISTS equip_code VARCHAR(30),
  ADD COLUMN IF NOT EXISTS model_nm VARCHAR(100),
  ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
  ADD COLUMN IF NOT EXISTS purchase_corp_code VARCHAR(30),
  ADD COLUMN IF NOT EXISTS buy_date DATE,
  ADD COLUMN IF NOT EXISTS voltage VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pressure VARCHAR(50),
  ADD COLUMN IF NOT EXISTS install_location VARCHAR(200),
  ADD COLUMN IF NOT EXISTS equip_type_code VARCHAR(30),
  ADD COLUMN IF NOT EXISTS tact_time NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS equip_capa NUMERIC(10,2);

-- equip_code unique index
CREATE UNIQUE INDEX IF NOT EXISTS ux_master_equipment_equip_code
  ON master_equipment(equip_code)
  WHERE equip_code IS NOT NULL;

-- 공통코드 그룹: 생산설비구분 (EQUIP_CATEGORY)
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('EQUIP_CATEGORY', '생산설비구분', '생산설비 유형 분류', 'Y', 100)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('CU_NEG', 'Cu(-)', '음극 구리 계열', 1),
  ('AL_POS', 'Al(+)', '양극 알루미늄 계열', 2)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'EQUIP_CATEGORY'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 공통코드 그룹: 고장유형 (EQUIP_FAIL_TYPE)
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('EQUIP_FAIL_TYPE', '고장유형', '설비 고장 원인 분류', 'Y', 101)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('MECH_FAIL', '기계고장', '기계적 원인 고장', 1),
  ('ELEC_FAIL', '전기고장', '전기적 원인 고장', 2),
  ('SOFT_FAIL', '소프트웨어', '소프트웨어 오류', 3),
  ('UTIL_FAIL', '유틸리티', '유틸리티 공급 불량', 4),
  ('ETC_FAIL', '기타고장', '기타 원인', 5)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'EQUIP_FAIL_TYPE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 공통코드 그룹: 조편성 (SHIFT_CODE)
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('SHIFT_CODE', '조편성', '교대 근무 조 분류', 'Y', 102)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('A_SHIFT', 'A조', 'A조 근무', 1),
  ('B_SHIFT', 'B조', 'B조 근무', 2),
  ('C_SHIFT', 'C조', 'C조 근무', 3),
  ('D_SHIFT', 'D조', 'D조 근무', 4)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'SHIFT_CODE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 공통코드 그룹: Spare 설비구분 (EQUIP_SPARE_TYPE)
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('EQUIP_SPARE_TYPE', 'Spare 설비구분', 'Spare 부품 유형 분류', 'Y', 103)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('MECH_PART', '기계부품', '기계적 부품', 1),
  ('ELEC_PART', '전기부품', '전기/전자 부품', 2),
  ('CONSUMABLE', '소모품', '소모성 부품', 3),
  ('TOOL', '공구', '공구류', 4),
  ('ETC_SPARE', '기타', '기타 부품', 5)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'EQUIP_SPARE_TYPE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 공통코드 그룹: 정기검사결과 (INSPECT_RESULT)
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('INSPECT_RESULT', '정기검사결과', '정기검사 결과 분류', 'Y', 104)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('PASS', '양호', '정상 상태', 1),
  ('FAIL', '불량', '불량 상태', 2),
  ('REPAIR_NEED', '수리필요', '수리가 필요한 상태', 3),
  ('REPLACE_NEED', '교체필요', '부품 교체 필요', 4)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'INSPECT_RESULT'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- master_equipment 시드 데이터 (생산설비구분 16개 유닛)
INSERT INTO master_equipment (category, unit_number, line_name, max_speed, is_active)
SELECT v.category, v.unit_number, v.line_name, v.max_speed, 'Y'
FROM (VALUES
  ('CU_NEG', 'P3', 'E', 8.0),
  ('CU_NEG', 'P3', 'F', 8.0),
  ('CU_NEG', 'P4', 'G', 8.0),
  ('CU_NEG', 'P4', 'H', 8.0),
  ('CU_NEG', 'P5', 'I', 6.0),
  ('CU_NEG', 'P5', 'J', 6.0),
  ('CU_NEG', 'P6', 'K', 6.0),
  ('CU_NEG', 'P6', 'L', 6.0),
  ('AL_POS', 'S1', '1', 4.0),
  ('AL_POS', 'S1', '2', 4.0),
  ('AL_POS', 'S1', '3', 4.0),
  ('AL_POS', 'S1', '4', 4.0),
  ('AL_POS', 'S2', '5', 4.0),
  ('AL_POS', 'S2', '6', 4.0),
  ('AL_POS', 'S2', '7', 4.0),
  ('AL_POS', 'S2', '8', 4.0)
) AS v(category, unit_number, line_name, max_speed)
WHERE NOT EXISTS (
  SELECT 1 FROM master_equipment me
  WHERE me.unit_number = v.unit_number AND me.line_name = v.line_name
);
