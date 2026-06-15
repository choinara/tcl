-- =============================================
-- V33: 기준정보관리 메뉴 및 권한 등록
-- =============================================

-- 기준정보관리 대메뉴
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES ('MASTER_MGMT', '기준정보관리', NULL, 'Database', 5, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- 1. 고객관리
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0010', '고객관리', '/master/customer', 'Users', 1, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 2. 협력업체관리
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0020', '협력업체관리', '/master/supplier', 'Handshake', 2, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 3. 표준시간관리
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0030', '표준시간관리', '/master/standard-time', 'Clock', 3, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 4. 공정별약품
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0040', '공정별약품', '/master/process-chemical', 'FlaskConical', 4, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 5. 생산설비
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0050', '생산설비', '/master/equipment', 'Cog', 5, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 6. 원자재
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0060', '원자재', '/master/raw-material', 'Layers', 6, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 7. 제품
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0070', '제품', '/master/product', 'Package', 7, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 8. 시간당생산량
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0080', '시간당생산량', '/master/production-rate', 'Gauge', 8, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 9. 품질기준정보
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0090', '품질기준정보', '/master/quality-standard', 'ShieldCheck', 9, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 10. 품종별Spec
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0100', '품종별Spec', '/master/quality-spec', 'ClipboardList', 10, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 11. 외관검사항목
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'MM0110', '외관검사항목', '/master/appearance-inspection', 'Eye', 11, 'Y', 2
FROM system_menu WHERE menu_code = 'MASTER_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('MASTER_MGMT', 'MM0010', 'MM0020', 'MM0030', 'MM0040', 'MM0050', 'MM0060', 'MM0070', 'MM0080', 'MM0090', 'MM0100', 'MM0110')
  AND r.role_code = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );
