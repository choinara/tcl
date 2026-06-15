-- 생산관리 대메뉴
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES ('PROD_MGMT', '생산관리', NULL, 'Factory', 4, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- 생산계획등록 하위메뉴
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'PM0010', '생산계획등록', '/production/plan', 'CalendarClock', 1, 'Y', 2
FROM system_menu WHERE menu_code = 'PROD_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN 역할에 생산관리 메뉴 권한 부여 (이미 있으면 무시)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('PROD_MGMT', 'PM0010') AND r.role_code = 'SUPER_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);
