-- 전자결재 대메뉴
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES ('APPROVAL_MGMT', '전자결재', NULL, 'FileCheck', 4, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- 전자결재 하위메뉴
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'EA0010', '결재함', '/approval', 'Inbox', 1, 'Y', 2
FROM system_menu WHERE menu_code = 'APPROVAL_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'EA0020', '기안 작성', '/approval/new', 'FilePlus', 2, 'Y', 2
FROM system_menu WHERE menu_code = 'APPROVAL_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 기존 대메뉴 sort_order 조정 (전자결재를 생산관리 앞에 배치)
UPDATE system_menu SET sort_order = 5 WHERE menu_code = 'PROD_MGMT' AND sort_order = 4;
UPDATE system_menu SET sort_order = 6 WHERE menu_code = 'AAS_MGMT' AND sort_order = 5;

-- SUPER_ADMIN 역할에 전자결재 메뉴 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('APPROVAL_MGMT', 'EA0010', 'EA0020')
AND r.role_code = 'SUPER_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);
