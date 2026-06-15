-- APS 공통코드 시드

-- APS_SHIFT_TYPE 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('APS_SHIFT_TYPE', 'APS Shift 유형', 'APS 생산계획 Shift 유형', 'Y');

-- APS_SHIFT_TYPE 코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
VALUES
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_SHIFT_TYPE'),
     'DAY', '주간', '주간 근무', 'Y', 1),
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_SHIFT_TYPE'),
     'NIGHT', '야간', '야간 근무', 'Y', 2);

-- APS_CREW_CODE 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('APS_CREW_CODE', 'APS 작업조', 'APS 생산계획 작업조 코드', 'Y');

-- APS_CREW_CODE 코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
VALUES
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_CREW_CODE'),
     'CREW_A', 'A조', 'A 작업조', 'Y', 1),
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_CREW_CODE'),
     'CREW_B', 'B조', 'B 작업조', 'Y', 2);

-- APS_PLAN_STATUS 그룹
INSERT INTO common_code_group (group_code, group_name, description, use_yn)
VALUES ('APS_PLAN_STATUS', 'APS 계획 상태', 'APS 생산계획 상태 코드', 'Y');

-- APS_PLAN_STATUS 코드
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
VALUES
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_PLAN_STATUS'),
     'DRAFT', '초안', '초안 상태', 'Y', 1),
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_PLAN_STATUS'),
     'CONFIRMED', '확정', '확정 상태', 'Y', 2),
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_PLAN_STATUS'),
     'CANCELLED', '취소', '취소 상태', 'Y', 3),
    ((SELECT seq_id FROM common_code_group WHERE group_code = 'APS_PLAN_STATUS'),
     'REVISED', '수정', '수정된 계획', 'Y', 4);

-- ============================================================
-- APS 메뉴 등록 (3건: PM0040, PM0041, PM0042)
-- ============================================================

-- PM0040 APS 생산계획 메뉴 등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'PM0040', 'APS 생산계획', '/production/aps', 'CalendarCog', 50, 'Y', 2
FROM system_menu WHERE menu_code = 'PROD_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- PM0041 호기 가용능력 메뉴 등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'PM0041', '호기 가용능력', '/production/aps/capacity', 'Gauge', 51, 'Y', 2
FROM system_menu WHERE menu_code = 'PROD_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- PM0042 Takt Time 마스터 메뉴 등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'PM0042', 'Takt Time 마스터', '/production/aps/takt', 'Timer', 52, 'Y', 2
FROM system_menu WHERE menu_code = 'PROD_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ============================================================
-- 메뉴 권한 등록 (SUPER_ADMIN, ADMIN x 3 메뉴 = 6건)
-- ============================================================

-- PM0040 (APS 생산계획) -- approve 동작 있음 (commit/cancel/revise), can_approve='Y'
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'PM0040'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);

-- PM0041, PM0042 (마스터 데이터) -- approve 동작 없음, can_approve='N'
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('PM0041', 'PM0042')
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);

-- ============================================================
-- i18n 시드 (7개 언어 x 3메뉴 = 21건)
-- ============================================================

-- 한국어 (ko)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.PM0040', 'APS 생산계획'),
('ko', 'menu.PM0041', '호기 가용능력'),
('ko', 'menu.PM0042', 'Takt Time 마스터')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 영어 (en)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('en', 'menu.PM0040', 'APS Planning'),
('en', 'menu.PM0041', 'Line Capacity'),
('en', 'menu.PM0042', 'Takt Time Master')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 일본어 (ja)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ja', 'menu.PM0040', 'APS生産計画'),
('ja', 'menu.PM0041', 'ライン稼働能力'),
('ja', 'menu.PM0042', 'タクトタイムマスター')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 중국어 (zh)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('zh', 'menu.PM0040', 'APS生产计划'),
('zh', 'menu.PM0041', '产线产能'),
('zh', 'menu.PM0042', '节拍时间主数据')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 베트남어 (vi)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('vi', 'menu.PM0040', 'APS san xuat'),
('vi', 'menu.PM0041', 'Nang luc san xuat'),
('vi', 'menu.PM0042', 'Takt Time Master')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 인도네시아어 (id)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('id', 'menu.PM0040', 'APS Produksi'),
('id', 'menu.PM0041', 'Kapasitas Lini'),
('id', 'menu.PM0042', 'Takt Time Master')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 태국어 (th)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('th', 'menu.PM0040', 'APS การผลิต'),
('th', 'menu.PM0041', 'กำลังการผลิตสาย'),
('th', 'menu.PM0042', 'Takt Time Master')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
