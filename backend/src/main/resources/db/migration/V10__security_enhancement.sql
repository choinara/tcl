-- V10: 보안 강화 (PIPA/RFP 대응)
-- 계정 잠금, 비밀번호 정책, 휴면 계정 관리, 로그인 시도 기록

-- 1. admin_user 보안 필드 추가
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- 2. 로그인 시도 기록 테이블
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    reason VARCHAR(255),
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);

-- 3. 비밀번호 이력 테이블 (재사용 방지)
CREATE TABLE IF NOT EXISTS password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES admin_user(seq_id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- 4. 기존 사용자 password_changed_at, last_activity_at 초기화
UPDATE admin_user SET password_changed_at = created_at WHERE password_changed_at IS NULL;
UPDATE admin_user SET last_activity_at = COALESCE(last_login_at, created_at) WHERE last_activity_at IS NULL;
