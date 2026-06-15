-- 단일 세션 정책 적용: admin_user_id당 1건만 허용
-- GS인증 보안 요구사항: 동일 계정 동시 접속 제한

-- 1. 기존 중복 세션 정리 (사용자당 최신 1건만 유지)
DELETE FROM admin_user_session
WHERE id NOT IN (
    SELECT DISTINCT ON (admin_user_id) id
    FROM admin_user_session
    ORDER BY admin_user_id, updated_at DESC
);

-- 2. UNIQUE 제약 추가 (이미 존재할 경우 무시)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_admin_user_session_user_id'
    ) THEN
        ALTER TABLE admin_user_session
            ADD CONSTRAINT uk_admin_user_session_user_id UNIQUE (admin_user_id);
    END IF;
END $$;
