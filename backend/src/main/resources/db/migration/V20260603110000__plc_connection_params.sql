-- data_source: PLC 연결 파라미터 추가
ALTER TABLE data_source
  ADD COLUMN IF NOT EXISTS unit_id SMALLINT,
  ADD COLUMN IF NOT EXISTS address_base SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS byte_order VARCHAR(20) DEFAULT 'BIG_ENDIAN',
  ADD COLUMN IF NOT EXISTS word_order VARCHAR(20) DEFAULT 'HIGH_WORD_FIRST';

-- opcua_data_point: Modbus 데이터 포인트 파라미터 추가
ALTER TABLE opcua_data_point
  ADD COLUMN IF NOT EXISTS memory_area VARCHAR(30),
  ADD COLUMN IF NOT EXISTS register_count SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bit_position SMALLINT;

-- 공통코드: Modbus 메모리 영역
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('MODBUS_MEMORY_AREA', 'Modbus 메모리 영역', 'Modbus Function Code 기반 메모리 영역 구분', 'Y')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('FC01_COIL',        'Coil (FC01) - 비트 R/W',              'Coil 비트 R/W',            1),
  ('FC02_DISCRETE',    'Discrete Input (FC02) - 비트 RO',     'Discrete Input 비트 RO',    2),
  ('FC03_INPUT_REG',   'Input Register (FC03) - 워드 RO',     'Input Register 워드 RO',    3),
  ('FC04_HOLDING_REG', 'Holding Register (FC04) - 워드 R/W',  'Holding Register 워드 R/W', 4)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'MODBUS_MEMORY_AREA'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 공통코드: 바이트 순서
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('MODBUS_BYTE_ORDER', 'Modbus 바이트 순서', 'Modbus 데이터 바이트 해석 순서', 'Y')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('BIG_ENDIAN',    'Big Endian (Motorola)', 'Big Endian 바이트 순서',    1),
  ('LITTLE_ENDIAN', 'Little Endian (Intel)', 'Little Endian 바이트 순서', 2)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'MODBUS_BYTE_ORDER'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 공통코드: 워드 순서
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('MODBUS_WORD_ORDER', 'Modbus 워드 순서', '32비트 이상 값의 상위/하위 워드 위치', 'Y')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('HIGH_WORD_FIRST', '상위 워드 먼저 (Big-endian)',    '상위 워드 먼저', 1),
  ('LOW_WORD_FIRST',  '하위 워드 먼저 (Little-endian)', '하위 워드 먼저', 2)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'MODBUS_WORD_ORDER'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);
