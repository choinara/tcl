-- Seed Data: Roles, Admin User, Default Menus

-- Roles
INSERT INTO admin_role (role_code, role_name, description) VALUES ('SUPER_ADMIN', '최고관리자', '시스템 전체 관리 권한');
INSERT INTO admin_role (role_code, role_name, description) VALUES ('ADMIN', '관리자', '일반 관리 권한');

-- Admin User (password: admin123, BCrypt encoded)
INSERT INTO admin_user (username, password, name, email, status)
VALUES ('admin', '$2a$10$7MiW/OKEsVHy4e.FhKBnkOy9U4H8fOvzABlpsQxDDzVaoUThxyd0i', '관리자', 'admin@peakmate.com', 'ACTIVE');

-- Assign SUPER_ADMIN role to admin user
INSERT INTO admin_user_role (admin_user_id, admin_role_id)
SELECT u.seq_id, r.seq_id FROM admin_user u, admin_role r WHERE u.username = 'admin' AND r.role_code = 'SUPER_ADMIN';

-- Default Menus
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level) VALUES
('DASHBOARD', '대시보드', '/', 'LayoutDashboard', 1, 'Y', 1),
('USER_MGMT', '조직관리', NULL, 'Users', 2, 'Y', 1),
('SYS_MGMT', '시스템관리', NULL, 'Settings', 3, 'Y', 1);

-- User Management sub-menus
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'UM0010', '사용자관리', '/system/users', 'UserCog', 1, 'Y', 2 FROM system_menu WHERE menu_code = 'USER_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'UM0020', '부서관리', '/organization/department', 'Building2', 2, 'Y', 2 FROM system_menu WHERE menu_code = 'USER_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'UM0030', '회사관리', '/organization/company', 'Building', 3, 'Y', 2 FROM system_menu WHERE menu_code = 'USER_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'UM0040', '직위관리', '/organization/position', 'Award', 4, 'Y', 2 FROM system_menu WHERE menu_code = 'USER_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'UM0050', '조직도', '/organization/chart', 'Network', 5, 'Y', 2 FROM system_menu WHERE menu_code = 'USER_MGMT';

-- System Management sub-menus
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0010', '메뉴관리', '/system/menus', 'Menu', 1, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0020', '메뉴권한관리', '/system/menu-auth', 'Shield', 2, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0030', '역할관리', '/system/roles', 'UserCheck', 3, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0040', '시스템설정', '/system/settings', 'Wrench', 4, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0050', '예외권한부여', '/system/user-auth', 'ShieldCheck', 5, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0060', '시스템로그', '/system/logs', 'FileText', 6, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0070', '알림/게시판', '/system/notification', 'Bell', 7, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0080', 'UI설정', '/system/ui-settings', 'Palette', 8, 'Y', 2 FROM system_menu WHERE menu_code = 'SYS_MGMT';

-- Grant SUPER_ADMIN full permissions on all menus
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r WHERE r.role_code = 'SUPER_ADMIN';

-- Common Code Groups
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order) VALUES
('USER_STATUS', '사용자상태', '사용자 계정 상태', 'Y', 1),
('ROLE_TYPE', '역할유형', '시스템 역할 유형', 'Y', 2),
('YN', '예/아니오', '예/아니오 선택', 'Y', 3);

-- Common Codes
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'ACTIVE', '활성', 'Y', 1 FROM common_code_group WHERE group_code = 'USER_STATUS';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'INACTIVE', '비활성', 'Y', 2 FROM common_code_group WHERE group_code = 'USER_STATUS';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'PENDING', '대기', 'Y', 3 FROM common_code_group WHERE group_code = 'USER_STATUS';

INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'SUPER_ADMIN', '최고관리자', 'Y', 1 FROM common_code_group WHERE group_code = 'ROLE_TYPE';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'ADMIN', '관리자', 'Y', 2 FROM common_code_group WHERE group_code = 'ROLE_TYPE';

INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'Y', '예', 'Y', 1 FROM common_code_group WHERE group_code = 'YN';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'N', '아니오', 'Y', 2 FROM common_code_group WHERE group_code = 'YN';
