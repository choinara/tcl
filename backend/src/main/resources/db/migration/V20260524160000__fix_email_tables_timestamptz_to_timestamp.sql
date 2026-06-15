-- V20260524160000: 이메일 도메인 테이블 TIMESTAMPTZ → TIMESTAMP(6) 타입 변환
-- 원인: AuditableEntity.createdAt/updatedAt 필드 타입이 LocalDateTime(TIMESTAMP)인데
--        V69~V71에서 생성된 이메일 테이블이 TIMESTAMPTZ를 사용 → Hibernate 6 타입 불일치 예외
-- 기존 모든 테이블은 TIMESTAMP(6)을 사용하므로 이메일 테이블도 동일하게 맞춤

-- email_message (V69)
ALTER TABLE email_message
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- email_attachment (V69)
ALTER TABLE email_attachment
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- email_customer_mapping (V70)
ALTER TABLE email_customer_mapping
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- email_classification_template (V70)
ALTER TABLE email_classification_template
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- email_label_mapping (V70)
ALTER TABLE email_label_mapping
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- email_oauth_token (V71)
ALTER TABLE email_oauth_token
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';

-- email_ai_usage (V71)
ALTER TABLE email_ai_usage
  ALTER COLUMN created_at TYPE TIMESTAMP(6) USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMP(6) USING updated_at AT TIME ZONE 'UTC';
