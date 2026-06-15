-- 시스템 설정 테이블 (key-value 방식)
CREATE TABLE IF NOT EXISTS system_setting (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    description   VARCHAR(200),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 다중로그인 설정 기본값: true (다중로그인 불가)
INSERT INTO system_setting (setting_key, setting_value, description)
VALUES ('security.single-login', 'true', '다중로그인 제한 (true: 1인 1세션, false: 다중 허용)')
ON CONFLICT (setting_key) DO NOTHING;
