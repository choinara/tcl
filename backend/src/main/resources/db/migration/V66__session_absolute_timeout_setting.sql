-- 절대 타임아웃 시간을 system_setting으로 관리 (기존 plusHours(8) 하드코딩 제거)
INSERT INTO system_setting (setting_key, setting_value, description, created_at, updated_at)
VALUES ('security.session.absolute-timeout-hours', '8',
        '절대 타임아웃 (시간) — 로그인 후 이 시간이 지나면 토큰 갱신 불가',
        NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;
