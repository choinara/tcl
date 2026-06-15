-- menu_role_permission 테이블에 can_view_pii 컬럼 추가
ALTER TABLE menu_role_permission
    ADD COLUMN can_view_pii CHAR(1) NOT NULL DEFAULT 'N';

-- user_permission 테이블에 can_view_pii 컬럼 추가
ALTER TABLE user_permission
    ADD COLUMN can_view_pii CHAR(1) NOT NULL DEFAULT 'N';

-- SUPER_ADMIN 역할에 UM0010(사용자관리) 메뉴의 PII 조회 권한 부여
UPDATE menu_role_permission
SET can_view_pii = 'Y'
WHERE admin_role_id = (SELECT seq_id FROM admin_role WHERE role_code = 'SUPER_ADMIN')
  AND menu_id = (SELECT seq_id FROM system_menu WHERE menu_code = 'UM0010');
