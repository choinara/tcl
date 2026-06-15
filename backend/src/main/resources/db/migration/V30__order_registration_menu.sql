-- 수주등록 하위메뉴 (생산관리 카테고리)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'PM0020', '수주등록', '/production/order', 'ClipboardList', 2, 'Y', 2
FROM system_menu WHERE menu_code = 'PROD_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN 역할에 수주등록 메뉴 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'PM0020' AND r.role_code = 'SUPER_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);
