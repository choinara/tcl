-- AA0030(데이터 수집 설정) ADMIN 역할 권한 누락 보완
-- V19에서 SUPER_ADMIN에만 AAS 메뉴 권한이 부여됨. ADMIN 역할에도 부여.
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('AAS_MGMT', 'AA0010', 'AA0020', 'AA0030', 'AA0040', 'AA0050', 'AA0060', 'AA0070', 'AA0080')
  AND r.role_code = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM menu_role_permission mrp
      WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );
