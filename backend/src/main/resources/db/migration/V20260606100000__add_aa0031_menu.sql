-- AA0031 수집항목 관리 신규 메뉴 등록 + AA0050 폐기
-- 2026-06-06

-- 1. 기존 sort_order 충돌 방지: AA0040 이후 메뉴를 1씩 증가 (AA0040=5, AA0050=6, AA0060=7, AA0070=8, AA0080=9)
UPDATE system_menu SET sort_order = sort_order + 1
WHERE parent_id = (SELECT seq_id FROM system_menu WHERE menu_code = 'AAS_MGMT')
  AND sort_order >= 4;

-- 2. AA0031 신규 메뉴 등록 (AAS_MGMT 하위, AA0030(sort=3) 다음인 sort_order=4)
INSERT INTO system_menu (menu_code, menu_name, menu_path, parent_id, sort_order, use_yn, menu_level)
SELECT 'AA0031', '수집항목 관리', '/aas/collection-items', seq_id, 4, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT';

-- 3. AA0031 권한 부여 (AA0030과 동일한 역할에 동일한 권한 복제)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT (SELECT seq_id FROM system_menu WHERE menu_code = 'AA0031'),
       admin_role_id, can_read, can_create, can_update, can_delete, can_export
FROM menu_role_permission
WHERE menu_id = (SELECT seq_id FROM system_menu WHERE menu_code = 'AA0030');

-- 4. AA0050 폐기
UPDATE system_menu SET use_yn = 'N' WHERE menu_code = 'AA0050';
