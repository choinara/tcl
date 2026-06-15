-- 공통코드 관리 메뉴 추가
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0090', '공통코드관리', '/system/common-codes', 'BookOpen', 10, 'Y', 2
FROM system_menu WHERE menu_code = 'SYS_MGMT';

-- SUPER_ADMIN 역할에 공통코드관리 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'SM0090' AND r.role_code = 'SUPER_ADMIN';

-- ══════════════════════════════════════════════════════════════
-- 공통코드 그룹 시드 데이터 (OrbitMES 마이그레이션)
-- ══════════════════════════════════════════════════════════════

INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES
  ('DEPT_CODE',   '부서코드',    '부서코드 유형',     'Y', 10),
  ('POS_LEVEL',   '직급레벨',    '직급 단계 구분',    'Y', 11),
  ('USER_ROLE',   '사용자역할',  '사용자 역할 유형',  'Y', 12),
  ('SHIFT_TYPE',  '교대구분',    '교대 근무 유형',    'Y', 20),
  ('PRIORITY',    '우선순위',    '우선순위 구분',     'Y', 21),
  ('USE_YN',      '사용여부',    '사용/미사용 구분',  'Y', 30)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 공통코드 시드 데이터
-- ══════════════════════════════════════════════════════════════

-- DEPT_CODE (부서코드)
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('DEV',   '개발부',   '소프트웨어 개발', 1),
  ('PLAN',  '기획부',   '사업 기획',       2),
  ('SALES', '영업부',   '영업 및 판매',    3),
  ('HR',    '인사부',   '인사 관리',       4),
  ('FIN',   '재무부',   '재무 회계',       5),
  ('QA',    '품질관리부', '품질 관리',     6),
  ('PROD',  '생산부',   '생산 관리',       7),
  ('MKT',   '마케팅부', '마케팅',          8),
  ('ADMIN', '관리부',   '총무 관리',       9)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'DEPT_CODE'
ON CONFLICT DO NOTHING;

-- POS_LEVEL (직급레벨) - 기존 DEPT_LEVEL 데이터와 별도
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('1', '임원',   '임원급',   1),
  ('2', '부장',   '부장급',   2),
  ('3', '차장',   '차장급',   3),
  ('4', '과장',   '과장급',   4),
  ('5', '대리',   '대리급',   5),
  ('6', '사원',   '사원급',   6)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'POS_LEVEL'
ON CONFLICT DO NOTHING;

-- USER_ROLE (사용자역할)
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('SUPER_ADMIN', '최고관리자', '시스템 전체 관리',    1),
  ('ADMIN',       '관리자',     '일반 관리',           2),
  ('MANAGER',     '매니저',     '부서/팀 관리',        3),
  ('VIEWER',      '조회자',     '조회 전용 권한',      4)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'USER_ROLE'
ON CONFLICT DO NOTHING;

-- SHIFT_TYPE (교대구분)
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('DAY',   '주간',   '주간 근무', 1),
  ('NIGHT', '야간',   '야간 근무', 2)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'SHIFT_TYPE'
ON CONFLICT DO NOTHING;

-- PRIORITY (우선순위)
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('HIGH',   '높음',   '우선순위 높음', 1),
  ('MEDIUM', '보통',   '우선순위 보통', 2),
  ('LOW',    '낮음',   '우선순위 낮음', 3)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'PRIORITY'
ON CONFLICT DO NOTHING;

-- USE_YN (사용여부)
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('Y', '사용',   '사용 중', 1),
  ('N', '미사용', '미사용',  2)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'USE_YN'
ON CONFLICT DO NOTHING;
