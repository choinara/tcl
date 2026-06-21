-- V90: TCL 이메일 분류 체계 정비 (참조용 — TCL은 Flyway 미사용, 직접 실행 필요)
-- 실행 순서: 1→2→3→4 순서 준수

-- ============================================================
-- 1. email_message 에 classification_summary 컬럼 추가
-- ============================================================
ALTER TABLE email_message ADD COLUMN IF NOT EXISTS classification_summary VARCHAR(200);

-- ============================================================
-- 2. common_code EMAIL_PURPOSE — 구 코드 삭제 후 6개 재삽입
-- ============================================================
DELETE FROM common_code
WHERE group_id = (SELECT seq_id FROM common_code_group WHERE group_code = 'EMAIL_PURPOSE')
  AND code IN ('QUOTATION', 'EXPORT_CUSTOMS', 'LOGISTICS_BL', 'EXPORT_SHIPPING',
               'SPARE_PARTS', 'MAINTENANCE', 'OTHER');

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('FREIGHT_INQUIRY', '운임 문의', '운임 문의, 견적 요청, 단가 확인',     10),
  ('BOOKING',         '부킹/SR',   '부킹/SR 요청, 선복 문의, 예약 확인', 20),
  ('BL_DOCS',         '선적 서류', 'B/L, 패킹리스트, 인보이스, CO, AWB', 30),
  ('TRACKING',        '선적 추적', '컨테이너 추적, ETA/ETD 확인',         40),
  ('CUSTOMS',         '통관',      '통관 문의, HS CODE, 수입신고',        50),
  ('OTHER',           '기타',      '위 카테고리에 해당하지 않는 경우',     99)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'EMAIL_PURPOSE'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- ============================================================
-- 3. email_classification_template — 6개 시드 INSERT (정본)
-- ============================================================
INSERT INTO email_classification_template
  (purpose_code, purpose_name, target_table, field_mapping, is_active, sort_order,
   created_at, updated_at)
VALUES
  ('FREIGHT_INQUIRY', '운임 문의', 'freight_rates',
   '{"keywords":["운임","견적","단가","운임 협의","FCL","LCL","요율"],"description":"운임 문의, 견적 요청, 단가 확인, 운임 협의","promptHint":"운임 문의, 견적 요청, 단가 확인, 운임 협의"}',
   'Y', 10, now(), now()),
  ('BOOKING', '부킹/SR', NULL,
   '{"keywords":["부킹","SR","선복","예약","스케줄","booking","space"],"description":"부킹/SR 요청, 선복 문의, 예약 확인, 스케줄 요청","promptHint":"부킹/SR 요청, 선복 문의, 예약 확인, 스케줄 요청"}',
   'Y', 20, now(), now()),
  ('BL_DOCS', '선적 서류', NULL,
   '{"keywords":["BL","B/L","선하증권","패킹리스트","인보이스","CO","AWB","수출신고","서류"],"description":"B/L 요청, 선적서류, AWB, 수출신고, 서류 수정","promptHint":"B/L 요청, 선적서류(패킹리스트·인보이스·CO), AWB, 수출신고, 서류 수정"}',
   'Y', 30, now(), now()),
  ('TRACKING', '선적 추적', NULL,
   '{"keywords":["추적","tracking","컨테이너","ETA","ETD","선박","위치","도착"],"description":"컨테이너 추적, 선박 위치, ETA/ETD 확인","promptHint":"컨테이너 추적, 선박 위치, ETA/ETD 확인, 도착 예정 문의"}',
   'Y', 40, now(), now()),
  ('CUSTOMS', '통관', NULL,
   '{"keywords":["통관","관부과세","HS","HS CODE","수입신고","관세청","세관"],"description":"통관 문의, 관부과세, HS CODE, 수입신고","promptHint":"통관 문의, 관부과세, HS CODE, 수입신고, 관세청 서류"}',
   'Y', 50, now(), now()),
  ('OTHER', '기타', NULL,
   '{"keywords":[],"description":"위 카테고리에 해당하지 않는 경우","promptHint":"위 카테고리에 해당하지 않는 경우"}',
   'Y', 99, now(), now())
ON CONFLICT (purpose_code) DO UPDATE SET
  purpose_name  = EXCLUDED.purpose_name,
  field_mapping = EXCLUDED.field_mapping,
  is_active     = EXCLUDED.is_active,
  sort_order    = EXCLUDED.sort_order,
  updated_at    = now();

-- ============================================================
-- 4. email_message 기존 분류코드 마이그레이션 (구 코드 → 신 코드)
-- ============================================================
UPDATE email_message SET classification_purpose = 'FREIGHT_INQUIRY'
WHERE classification_purpose = 'QUOTATION';

UPDATE email_message SET classification_purpose = 'BL_DOCS'
WHERE classification_purpose IN ('LOGISTICS_BL', 'EXPORT_SHIPPING');

UPDATE email_message SET classification_purpose = 'CUSTOMS'
WHERE classification_purpose = 'EXPORT_CUSTOMS';
