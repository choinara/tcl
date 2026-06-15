-- AA0021: Asset Instance 관리_old (AA0020 기존 방식 보관용)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0021', 'Asset Instance 관리_old', '/aas/instances-old', 'Package', 9, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN / ADMIN 자동 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'AA0021'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
      SELECT 1 FROM menu_role_permission mrp
      WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );
