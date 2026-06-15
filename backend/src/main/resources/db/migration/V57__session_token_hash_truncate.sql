-- 기존 평문 토큰 세션 삭제 (해시 전환을 위해)
-- 해시 전환 후 기존 평문 토큰은 검증 불가하므로 전체 세션 초기화
-- 모든 사용자 재로그인 필요
TRUNCATE TABLE admin_user_session;
