-- 메일 서버 설정 (시스템 설정 테이블에 추가)
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.enabled', 'false', '메일 발송 기능 활성화 여부', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.host', '', 'SMTP 서버 호스트', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.port', '25', 'SMTP 서버 포트', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.username', '', 'SMTP 인증 계정', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.password', '', 'SMTP 인증 비밀번호', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.smtp-auth', 'false', 'SMTP 인증 사용 여부', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.starttls', 'false', 'STARTTLS 암호화 사용 여부', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.from-address', 'noreply@peakmate.local', '발신자 이메일 주소', CURRENT_TIMESTAMP);
INSERT INTO system_setting (setting_key, setting_value, description, updated_at)
VALUES ('mail.from-name', 'PeakMate', '발신자 표시 이름', CURRENT_TIMESTAMP);
