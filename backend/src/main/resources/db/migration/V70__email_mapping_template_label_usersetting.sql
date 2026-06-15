-- V70: email_customer_mapping + email_classification_template + email_label_mapping + user_setting

-- email_customer_mapping
CREATE TABLE email_customer_mapping (
  id BIGSERIAL PRIMARY KEY,
  customer_code  VARCHAR(50) NOT NULL,
  customer_name  VARCHAR(200) NOT NULL,
  email_or_domain VARCHAR(320) NOT NULL,
  mapping_type   VARCHAR(10) NOT NULL,
  is_active      VARCHAR(1) NOT NULL DEFAULT 'Y',
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     VARCHAR(100),
  updated_by     VARCHAR(100),
  CONSTRAINT uq_email_customer_mapping UNIQUE (email_or_domain, mapping_type),
  CONSTRAINT ck_email_customer_mapping_type CHECK (mapping_type IN ('EMAIL','DOMAIN'))
);
CREATE INDEX idx_email_customer_mapping_customer ON email_customer_mapping (customer_code);

-- email_classification_template (업무별 템플릿 정의)
CREATE TABLE email_classification_template (
  id BIGSERIAL PRIMARY KEY,
  purpose_code   VARCHAR(50) NOT NULL,
  purpose_name   VARCHAR(200) NOT NULL,
  target_table   VARCHAR(100),
  field_mapping  JSONB NOT NULL,
  is_active      VARCHAR(1) NOT NULL DEFAULT 'Y',
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     VARCHAR(100),
  updated_by     VARCHAR(100),
  CONSTRAINT uq_email_classification_template_purpose UNIQUE (purpose_code)
);

-- email_label_mapping
CREATE TABLE email_label_mapping (
  id BIGSERIAL PRIMARY KEY,
  account_id     BIGINT NOT NULL,
  gmail_label    VARCHAR(200) NOT NULL,
  purpose_code   VARCHAR(50) NOT NULL,
  is_active      VARCHAR(1) NOT NULL DEFAULT 'Y',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     VARCHAR(100),
  updated_by     VARCHAR(100),
  CONSTRAINT uq_email_label_mapping UNIQUE (account_id, gmail_label)
);

-- user_setting (범용 사용자 옵션 key-value)
-- 사유: AdminUser PII 5필드 암호화로 이미 무거움. 도메인 옵션 분리로 4-layer 원칙 준수.
-- 첫 사용처: 이메일관리 분류 완료 알림 옵션 (email.notify.classification-completed)
CREATE TABLE user_setting (
  id BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL,
  setting_key    VARCHAR(100) NOT NULL,
  setting_value  VARCHAR(500),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     VARCHAR(100),
  updated_by     VARCHAR(100),
  CONSTRAINT uq_user_setting UNIQUE (user_id, setting_key)
);
CREATE INDEX idx_user_setting_user ON user_setting (user_id);
COMMENT ON TABLE user_setting IS '사용자별 도메인 옵션 (key-value). 첫 사용처: 이메일관리 분류 완료 알림 옵션';
