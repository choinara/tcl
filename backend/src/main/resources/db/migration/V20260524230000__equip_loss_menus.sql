-- ET0060 설비별 Loss 관리 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0060', '설비별 Loss 관리', '/et/loss-mgmt', 'bar-chart-2', 6, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0070 MTBF 관리 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0070', 'MTBF 관리', '/et/mtbf', 'activity', 7, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0080 MTTR 관리 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0080', 'MTTR 관리', '/et/mttr', 'clock', 8, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0100 설비 Loss 전체 조회 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0100', '설비 Loss 전체 조회', '/et/loss-event', 'list', 10, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('ET0060','ET0070','ET0080','ET0100')
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (SELECT 1 FROM menu_role_permission mrp WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id);

-- i18n (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0060', '설비별 Loss 관리'),
('en', 'menu.ET0060', 'Equipment Loss Mgmt'),
('ja', 'menu.ET0060', '設備別Loss管理'),
('zh', 'menu.ET0060', '设备Loss管理'),
('vi', 'menu.ET0060', 'Equipment Loss Mgmt'),
('id', 'menu.ET0060', 'Equipment Loss Mgmt'),
('th', 'menu.ET0060', 'Equipment Loss Mgmt'),
('ko', 'menu.ET0070', 'MTBF 관리'),
('en', 'menu.ET0070', 'MTBF Management'),
('ja', 'menu.ET0070', 'MTBF管理'),
('zh', 'menu.ET0070', 'MTBF管理'),
('vi', 'menu.ET0070', 'MTBF Management'),
('id', 'menu.ET0070', 'MTBF Management'),
('th', 'menu.ET0070', 'MTBF Management'),
('ko', 'menu.ET0080', 'MTTR 관리'),
('en', 'menu.ET0080', 'MTTR Management'),
('ja', 'menu.ET0080', 'MTTR管理'),
('zh', 'menu.ET0080', 'MTTR管理'),
('vi', 'menu.ET0080', 'MTTR Management'),
('id', 'menu.ET0080', 'MTTR Management'),
('th', 'menu.ET0080', 'MTTR Management'),
('ko', 'menu.ET0100', '설비 Loss 전체 조회'),
('en', 'menu.ET0100', 'Loss Event List'),
('ja', 'menu.ET0100', '設備Loss一覧'),
('zh', 'menu.ET0100', '设备Loss列表'),
('vi', 'menu.ET0100', 'Loss Event List'),
('id', 'menu.ET0100', 'Loss Event List'),
('th', 'menu.ET0100', 'Loss Event List')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
