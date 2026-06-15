-- AAS_SOURCE_TYPE 공통코드
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('AAS_SOURCE_TYPE', '데이터소스 유형', 'AAS 데이터 수집 소스 유형', 'Y')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('VISION',   '비전',     'Vision 검사 장비',     1),
  ('PLC',      'PLC',      'PLC 제어기',          2),
  ('OPC_UA',   'OPC-UA',   'OPC-UA 서버',         3),
  ('MQTT',     'MQTT',     'MQTT 브로커',          4),
  ('HTTP_API', 'HTTP API', 'HTTP REST API',       5)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'AAS_SOURCE_TYPE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- AAS_PROTOCOL 공통코드
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('AAS_PROTOCOL', '데이터소스 프로토콜', 'AAS 데이터 수집 통신 프로토콜', 'Y')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('SMB',        'SMB (Server Message Block)', 'SMB 파일 공유',      1),
  ('MODBUS_TCP', 'Modbus/TCP',                 'Modbus/TCP 통신',    2),
  ('OPC_UA',     'OPC-UA',                     'OPC-UA 통신',        3),
  ('MQTT',       'MQTT',                        'MQTT 메시징',        4),
  ('RS232',      'RS-232',                      'RS-232 시리얼',      5),
  ('RS485',      'RS-485',                      'RS-485 시리얼',      6),
  ('HTTP_REST',  'HTTP REST',                   'HTTP REST API',     7),
  ('PROFINET',   'PROFINET',                    'PROFINET 통신',      8),
  ('ETHERCAT',   'EtherCAT',                    'EtherCAT 통신',      9),
  ('CANOPEN',    'CANopen',                     'CANopen 통신',      10),
  ('BACNET',     'BACnet',                      'BACnet 통신',       11)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'AAS_PROTOCOL'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 기존 data_source 행의 source_type 소문자 → 대문자 정규화 (공통코드 체계 일치)
UPDATE data_source SET source_type = UPPER(source_type) WHERE source_type <> UPPER(source_type);

-- data_source: asset_instance_code, asset_instance_name 컬럼 추가 (논리 참조, FK 없음)
ALTER TABLE data_source
  ADD COLUMN IF NOT EXISTS asset_instance_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS asset_instance_name VARCHAR(255);

-- 메뉴명 변경
UPDATE system_menu SET menu_name = '데이터 연결 대상 설정' WHERE menu_code = 'AA0040';

-- i18n 메뉴명
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
  ('ko', 'menu.AA0040', '데이터 연결 대상 설정'),
  ('en', 'menu.AA0040', 'Data Connection Settings')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
