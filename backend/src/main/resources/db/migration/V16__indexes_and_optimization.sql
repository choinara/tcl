-- V16: DB 인덱스 최적화

-- admin_user 테이블
CREATE INDEX IF NOT EXISTS idx_admin_user_username ON admin_user(username);
CREATE INDEX IF NOT EXISTS idx_admin_user_status ON admin_user(status);
CREATE INDEX IF NOT EXISTS idx_admin_user_status_activity ON admin_user(status, last_activity_at);
CREATE INDEX IF NOT EXISTS idx_admin_user_created_at ON admin_user(created_at);

-- system_log 테이블
CREATE INDEX IF NOT EXISTS idx_system_log_username ON system_log(username);
CREATE INDEX IF NOT EXISTS idx_system_log_log_type ON system_log(log_type);
CREATE INDEX IF NOT EXISTS idx_system_log_created_at ON system_log(created_at);
CREATE INDEX IF NOT EXISTS idx_system_log_type_date ON system_log(log_type, created_at);

-- login_attempts 테이블 (존재 시에만)
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);

-- admin_user_role 테이블
CREATE INDEX IF NOT EXISTS idx_admin_user_role_user_id ON admin_user_role(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_role_role_id ON admin_user_role(admin_role_id);

-- menu_role_permission 테이블
CREATE INDEX IF NOT EXISTS idx_menu_role_perm_role ON menu_role_permission(admin_role_id);
CREATE INDEX IF NOT EXISTS idx_menu_role_perm_menu ON menu_role_permission(menu_id);

-- consent_history 테이블
CREATE INDEX IF NOT EXISTS idx_consent_user_type ON consent_history(user_id, consent_type);
