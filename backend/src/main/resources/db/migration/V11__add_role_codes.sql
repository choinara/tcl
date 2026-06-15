-- 역할 코드 추가
INSERT INTO admin_role (role_code, role_name, description) VALUES ('DEV_LEAD', '개발책임', '개발팀 책임자 권한')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO admin_role (role_code, role_name, description) VALUES ('LEAD', '책임', '책임급 권한')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO admin_role (role_code, role_name, description) VALUES ('MANAGER', '매니저', '매니저 권한')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO admin_role (role_code, role_name, description) VALUES ('DEVELOPER', '개발', '개발자 권한')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO admin_role (role_code, role_name, description) VALUES ('USER', '일반', '일반 사용자 권한')
ON CONFLICT (role_code) DO NOTHING;
