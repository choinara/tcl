-- RS256 + jti 전환 마이그레이션
-- 기존 HS512 토큰 해시 기반 세션을 jti(UUID) 기반으로 전환

-- 1. 기존 세션 전체 삭제 (RS256 전환으로 기존 HS512 토큰 무효, 전체 재로그인 필요)
TRUNCATE TABLE admin_user_session;

-- 2. access_token 컬럼 → jti 컬럼으로 전환
ALTER TABLE admin_user_session DROP COLUMN IF EXISTS access_token;
ALTER TABLE admin_user_session ADD COLUMN jti VARCHAR(36) NOT NULL;

-- 3. jti UNIQUE 인덱스 (기존 access_token 인덱스 대체, 중복 방지)
DROP INDEX IF EXISTS idx_aus_access_token;
CREATE UNIQUE INDEX idx_aus_jti ON admin_user_session(jti);
