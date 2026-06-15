-- 자재관리 대분류 메뉴 + 가입고등록 하위 메뉴 + 공통코드

-- 대분류: 자재관리
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES ('MATERIAL_MGMT', '자재관리', NULL, 'Package', 6, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- 하위: 가입고등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'WH0010', '가입고등록', '/warehouse/pre-inbound', 'PackageCheck', 1, 'Y', 2
FROM system_menu WHERE menu_code = 'MATERIAL_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('MATERIAL_MGMT', 'WH0010')
  AND r.role_code = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );

-- 공통코드 그룹: 입고상태
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('WH_STATUS', '입고상태', '가입고 상태 구분', 'Y', 40)
ON CONFLICT DO NOTHING;

-- 공통코드 그룹: 입고승인
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('WH_APPROVAL', '입고승인', '가입고 승인 구분', 'Y', 41)
ON CONFLICT DO NOTHING;

-- 공통코드: 입고상태
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('가입고',   '가입고',   '가입고 등록 상태', 1),
  ('승인완료', '승인완료', '승인 완료 상태',   2),
  ('입고완료', '입고완료', '입고 확정 상태',   3),
  ('생산투입', '생산투입', '생산 투입 상태',   4)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'WH_STATUS'
ON CONFLICT DO NOTHING;

-- 공통코드: 입고승인
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('미승인', '미승인', '미승인 상태',       1),
  ('승인',   '승인',   '승인 완료',         2),
  ('불량',   '불량',   '불량 판정',         3),
  ('보류',   '보류',   '보류 상태',         4),
  ('반품',   '반품',   '반품 처리',         5),
  ('폐기',   '폐기',   '폐기 처리',         6)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'WH_APPROVAL'
ON CONFLICT DO NOTHING;
