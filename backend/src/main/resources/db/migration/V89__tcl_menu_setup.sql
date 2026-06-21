-- V89: TCL 메뉴 등록 + 비TCL PeakMate 메뉴 비활성화

-- ── 1. 비TCL 메뉴 비활성화 ─────────────────────────────────────────────
UPDATE system_menu SET use_yn = 'N'
WHERE menu_code IN (
  -- 생산관리
  'PROD_MGMT','PM0010','PM0020','PM0030','PM0040','PM0041','PM0042','PM0043','PM0050',
  -- 설비기술
  'ET_MGMT','ET0010','ET0020','ET0030','ET0040','ET0050','ET0060','ET0070','ET0080','ET0090','ET0100','ET0110','ET0120',
  -- AAS/OPC-UA
  'AAS_MGMT','AA0010','AA0020','AA0021','AA0030','AA0031','AA0040','AA0060','AA0070','AA0080','AA0090',
  -- 자재관리
  'MATERIAL_MGMT','WH0010',
  -- 전자결재 + 문서관리 + 유틸리티
  'APPROVAL_MGMT','EA0010','EA0020','EA0030','EA0040',
  'DOC0010','DOC0020','DOC0030','DOC0040','DOC0050','DOC0060',
  'UT0010','UT0020','UT0030',
  -- 기준정보관리
  'MASTER_MGMT','MM0010','MM0020','MM0030','MM0040','MM0050','MM0060','MM0070','MM0080','MM0090','MM0100','MM0110','MM0120',
  -- 개발도구
  'DEV_TOOLS','TS0010','TS0020','TS0030','TS0040','TS0050','TS0060'
);

-- ── 2. 기존 EM 메뉴 → TCL 이메일 자동화로 전환 ──────────────────────────
UPDATE system_menu SET menu_name = '이메일 자동화', sort_order = 10 WHERE menu_code = 'EM';

UPDATE system_menu SET menu_name = '이메일 대시보드', menu_path = '/email/dashboard', icon = 'layoutDashboard', sort_order = 10 WHERE menu_code = 'EM0010';
UPDATE system_menu SET menu_name = '이메일 검색',     menu_path = '/email/search',    icon = 'search',          sort_order = 20 WHERE menu_code = 'EM0020';
UPDATE system_menu SET menu_name = 'IMAP 계정 설정', menu_path = '/email/accounts',  icon = 'server',          sort_order = 30 WHERE menu_code = 'EM0030';
UPDATE system_menu SET menu_name = '배정 룰 관리',   menu_path = '/email/rules',     icon = 'gitBranch',       sort_order = 40 WHERE menu_code = 'EM0040';
UPDATE system_menu SET use_yn = 'N' WHERE menu_code = 'EM0050';

-- ── 3. TCL 신규 상위 메뉴 ─────────────────────────────────────────────
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level) VALUES
  (NULL, 'FR', '운임·스케줄', NULL, 'ship',    20, 'Y', 1),
  (NULL, 'TK', '선적 트랙킹', NULL, 'mapPin',  30, 'Y', 1),
  (NULL, 'CB', 'AI 챗봇',    NULL, 'bot',     40, 'Y', 1),
  (NULL, 'AD', '어드민',     NULL, 'sliders', 50, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- ── 4. TCL 신규 하위 메뉴 ─────────────────────────────────────────────
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level) VALUES
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'FR'), 'FR0010', '운임 현황',    '/freight/rates',     'dollarSign', 10, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'FR'), 'FR0020', '스케줄 현황',  '/freight/schedules', 'calendar',   20, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'TK'), 'TK0010', '선적 트랙킹',  '/tracking',          'mapPin',     10, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'CB'), 'CB0010', '업무 챗봇',    '/chatbot',           'messageCircle', 10, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'AD'), 'AD0010', '과제 관리',    '/admin/tasks',       'clipboardList', 10, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'AD'), 'AD0020', '스케줄러 현황','/admin/scheduler',   'activity',   20, 'Y', 2)
ON CONFLICT (menu_code) DO NOTHING;

-- ── 5. 신규 메뉴 권한 부여 (SUPER_ADMIN, ADMIN) ──────────────────────────
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y',
       CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 'Y' ELSE 'N' END,
       'N'
FROM system_menu m
CROSS JOIN admin_role r
WHERE m.menu_code IN ('FR','FR0010','FR0020','TK','TK0010','CB','CB0010','AD','AD0010','AD0020')
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
ON CONFLICT DO NOTHING;

-- ── 6. i18n 키 갱신 (EM 메뉴명 TCL로 교체) ──────────────────────────────
UPDATE i18n_message SET message_value = '이메일 자동화' WHERE lang_code = 'ko' AND message_key = 'menu.EM';
UPDATE i18n_message SET message_value = '이메일 대시보드' WHERE lang_code = 'ko' AND message_key = 'menu.EM0010';
UPDATE i18n_message SET message_value = '이메일 검색'    WHERE lang_code = 'ko' AND message_key = 'menu.EM0020';
UPDATE i18n_message SET message_value = 'IMAP 계정 설정' WHERE lang_code = 'ko' AND message_key = 'menu.EM0030';
UPDATE i18n_message SET message_value = '배정 룰 관리'   WHERE lang_code = 'ko' AND message_key = 'menu.EM0040';

UPDATE i18n_message SET message_value = 'Email Automation' WHERE lang_code = 'en' AND message_key = 'menu.EM';
UPDATE i18n_message SET message_value = 'Email Dashboard'  WHERE lang_code = 'en' AND message_key = 'menu.EM0010';
UPDATE i18n_message SET message_value = 'Email Search'     WHERE lang_code = 'en' AND message_key = 'menu.EM0020';
UPDATE i18n_message SET message_value = 'IMAP Accounts'    WHERE lang_code = 'en' AND message_key = 'menu.EM0030';
UPDATE i18n_message SET message_value = 'Assignment Rules' WHERE lang_code = 'en' AND message_key = 'menu.EM0040';

-- 신규 TCL 메뉴 i18n (ko/en)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
  ('ko', 'menu.FR',     '운임·스케줄'),   ('en', 'menu.FR',     'Freight & Schedule'),
  ('ko', 'menu.FR0010', '운임 현황'),      ('en', 'menu.FR0010', 'Freight Rates'),
  ('ko', 'menu.FR0020', '스케줄 현황'),    ('en', 'menu.FR0020', 'Vessel Schedules'),
  ('ko', 'menu.TK',     '선적 트랙킹'),    ('en', 'menu.TK',     'Shipment Tracking'),
  ('ko', 'menu.TK0010', '선적 트랙킹'),    ('en', 'menu.TK0010', 'Shipment Tracking'),
  ('ko', 'menu.CB',     'AI 챗봇'),        ('en', 'menu.CB',     'AI Chatbot'),
  ('ko', 'menu.CB0010', '업무 챗봇'),      ('en', 'menu.CB0010', 'Work Assistant'),
  ('ko', 'menu.AD',     '어드민'),         ('en', 'menu.AD',     'Admin'),
  ('ko', 'menu.AD0010', '과제 관리'),      ('en', 'menu.AD0010', 'Task Management'),
  ('ko', 'menu.AD0020', '스케줄러 현황'),  ('en', 'menu.AD0020', 'Scheduler Status')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
