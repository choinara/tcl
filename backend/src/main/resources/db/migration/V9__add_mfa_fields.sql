-- MFA (Multi-Factor Authentication) 필드 추가
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(64);
