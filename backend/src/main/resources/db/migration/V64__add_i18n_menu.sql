-- 다국어관리 메뉴 등록 (시스템관리 하위)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES (
    (SELECT seq_id FROM system_menu WHERE menu_code = 'SYS_MGMT'),
    'SM0100', '다국어관리', '/system/i18n', 'globe', 11, 'Y', 2
);

-- SUPER_ADMIN, ADMIN 역할에 전체 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m
CROSS JOIN admin_role r
WHERE m.menu_code = 'SM0100'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN');
