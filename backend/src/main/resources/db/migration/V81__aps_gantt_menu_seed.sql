-- PM0043 APS 간트차트 메뉴 등록

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'PM0043', 'APS 간트차트', '/production/aps/gantt', 'CalendarRange', 53, 'Y', 2
FROM system_menu WHERE menu_code = 'PROD_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 메뉴 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'PM0043'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);

-- i18n 시드 (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.PM0043', 'APS 간트차트'),
('en', 'menu.PM0043', 'APS Gantt'),
('ja', 'menu.PM0043', 'APS ガントチャート'),
('zh', 'menu.PM0043', 'APS甘特图'),
('vi', 'menu.PM0043', 'APS Biểu đồ Gantt'),
('id', 'menu.PM0043', 'APS Gantt'),
('th', 'menu.PM0043', 'APS แผนภูมิแกนต์')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
