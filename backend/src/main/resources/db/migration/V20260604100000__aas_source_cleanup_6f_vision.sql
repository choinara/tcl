-- AAS_SOURCE_TYPE: OPC_UA, MQTT, HTTP_API 삭제 (현장 미사용 소스 유형)
DELETE FROM common_code
WHERE group_id = (SELECT seq_id FROM common_code_group WHERE group_code = 'AAS_SOURCE_TYPE')
  AND code IN ('OPC_UA', 'MQTT', 'HTTP_API');

-- AAS_PROTOCOL: OPC_UA, MQTT, HTTP_REST 삭제 (현장 미사용 프로토콜)
DELETE FROM common_code
WHERE group_id = (SELECT seq_id FROM common_code_group WHERE group_code = 'AAS_PROTOCOL')
  AND code IN ('OPC_UA', 'MQTT', 'HTTP_REST');

-- 6층 비전 데이터소스 더미 4건 (생산설비(4라인) 1~2호기 A/B열)
-- DAQ 서버(172.29.17.71) SMB 공유: \\DAQSVR\CheckFileShare
INSERT INTO data_source (source_id, source_name, source_type, plc_protocol, plc_ip, plc_port,
                          vision_watch_folder, vision_csv_pattern, status, use_yn)
VALUES
  ('VS-6F-01A', '6층 1호기 A열 비전', 'VISION', 'SMB', '172.29.17.71', 445,
   '\\DAQSVR\CheckFileShare', '6F_01A_*.csv', 'ACTIVE', 'Y'),
  ('VS-6F-01B', '6층 1호기 B열 비전', 'VISION', 'SMB', '172.29.17.71', 445,
   '\\DAQSVR\CheckFileShare', '6F_01B_*.csv', 'ACTIVE', 'Y'),
  ('VS-6F-02A', '6층 2호기 A열 비전', 'VISION', 'SMB', '172.29.17.71', 445,
   '\\DAQSVR\CheckFileShare', '6F_02A_*.csv', 'ACTIVE', 'Y'),
  ('VS-6F-02B', '6층 2호기 B열 비전', 'VISION', 'SMB', '172.29.17.71', 445,
   '\\DAQSVR\CheckFileShare', '6F_02B_*.csv', 'ACTIVE', 'Y')
ON CONFLICT (source_id) DO NOTHING;
