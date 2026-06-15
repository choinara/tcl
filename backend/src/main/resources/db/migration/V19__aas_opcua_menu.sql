-- AAS/OPC-UA 대메뉴
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES ('AAS_MGMT', 'AAS/OPC-UA', NULL, 'Layers', 5, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- AAS/OPC-UA 하위메뉴
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0010', 'AAS 모델 관리', '/aas/modeling', 'FileBox', 1, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0020', 'Asset Instance 관리', '/aas/instances', 'Package', 2, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0030', '데이터 수집 설정', '/aas/collection', 'Database', 3, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0040', '데이터 연결', '/aas/connection', 'Link2', 4, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0050', '매핑 관리', '/opcua/mapping', 'ArrowLeftRight', 5, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0060', 'AAS 연계', '/aas/linkage', 'GitBranch', 6, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0070', 'OPC-UA 게이트웨이', '/opcua/gateway', 'Server', 7, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0080', '수집 모니터링', '/aas/monitor', 'Activity', 8, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN 역할에 AAS/OPC-UA 메뉴 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('AAS_MGMT', 'AA0010', 'AA0020', 'AA0030', 'AA0040', 'AA0050', 'AA0060', 'AA0070', 'AA0080')
AND r.role_code = 'SUPER_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);
