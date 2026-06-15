-- 업체구분 공통코드 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('PARTNER_TYPE', '업체구분', '협력사 업체 유형 분류', 'Y', 50)
ON CONFLICT (group_code) DO NOTHING;

-- 업체구분 공통코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('CUSTOMER', '고객사', '우리 제품을 구매하는 고객사', 1),
  ('SUPPLIER', '공급업체', '원재료를 공급하는 업체', 2),
  ('SUBCONTRACTOR', '외주업체', '공정 일부를 위탁하는 업체', 3),
  ('EQUIPMENT_SERVICE', '설비업체', '설비 유지보수/공급 업체', 4),
  ('MIXED', '복합', '2가지 이상 역할을 겸하는 업체', 5)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'PARTNER_TYPE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 거래상태 공통코드 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('TRANSACTION_STATUS', '거래상태', '협력사 거래 상태', 'Y', 51)
ON CONFLICT (group_code) DO NOTHING;

-- 거래상태 공통코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('ACTIVE', '거래중', '현재 거래 진행 중', 1),
  ('SUSPENDED', '거래중지', '거래 일시 중지', 2),
  ('TERMINATED', '거래종료', '거래 완전 종료', 3)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'TRANSACTION_STATUS'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);
