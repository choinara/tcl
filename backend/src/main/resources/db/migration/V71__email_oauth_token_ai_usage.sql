-- V71: email_oauth_token + email_ai_usage

CREATE TABLE email_oauth_token (
  id BIGSERIAL PRIMARY KEY,
  account_id     BIGINT NOT NULL,
  email_address  VARCHAR(320) NOT NULL,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  scope          VARCHAR(2000),
  token_expiry   TIMESTAMPTZ NOT NULL,
  last_refresh_at TIMESTAMPTZ,
  refresh_failure_count INT NOT NULL DEFAULT 0,
  is_active      VARCHAR(1) NOT NULL DEFAULT 'Y',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     VARCHAR(100),
  updated_by     VARCHAR(100),
  CONSTRAINT uq_email_oauth_token_account UNIQUE (account_id)
);

CREATE TABLE email_ai_usage (
  id BIGSERIAL PRIMARY KEY,
  email_message_id BIGINT NOT NULL,
  model_id         VARCHAR(100) NOT NULL,
  purpose          VARCHAR(50) NOT NULL,
  input_tokens     INT NOT NULL,
  output_tokens    INT NOT NULL,
  estimated_cost_usd NUMERIC(10,6) NOT NULL,
  called_at        TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       VARCHAR(100),
  updated_by       VARCHAR(100)
);
CREATE INDEX idx_email_ai_usage_called_at ON email_ai_usage (called_at DESC);
