-- 절대 타임아웃을 위한 세션 시작 시각 컬럼 추가
ALTER TABLE admin_user_session
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL;
