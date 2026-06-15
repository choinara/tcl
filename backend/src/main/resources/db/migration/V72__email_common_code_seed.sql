-- V72: 이메일관리 공통코드 시드 (V54 패턴 적용)

-- 이메일 업무목적 공통코드 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('EMAIL_PURPOSE', '이메일업무목적', '이메일 AI 분류 업무 목적', 'Y', 60)
ON CONFLICT (group_code) DO NOTHING;

-- 이메일 업무목적 공통코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('QUOTATION',      '견적요청', '견적 요청 메일',                10),
  ('EXPORT_CUSTOMS', '수출통관', '통관 서류 메일',                20),
  ('LOGISTICS_BL',   '물류선적', 'BL/SR/패킹리스트 등',           30),
  ('OTHER',          '기타',     '분류되지 않은 일반 메일',       99)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'EMAIL_PURPOSE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- 이메일 처리상태 공통코드 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('EMAIL_PROCESSING_STATUS', '이메일처리상태', '이메일 처리 단계 상태', 'Y', 61)
ON CONFLICT (group_code) DO NOTHING;

-- 이메일 처리상태 공통코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('PENDING',    '대기',     '수신 후 분류 전',                                          10),
  ('CLASSIFIED', '분류완료', 'AI 분류 완료, 담당자 확인 대기',                             20),
  ('UNASSIGNED', '미배정',   '신뢰도 미달 또는 미매핑 라벨 — 수동 배정 필요',              30),
  ('APPROVED',   '승인완료', '담당자 승인 완료',                                          40),
  ('REJECTED',   '거절',     '담당자 거절',                                              50)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'EMAIL_PROCESSING_STATUS'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);
