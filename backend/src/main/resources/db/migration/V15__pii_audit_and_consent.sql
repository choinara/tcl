-- V15: 개인정보 처리 감사 로그 및 동의 이력 테이블

-- 개인정보 처리 감사 로그
CREATE TABLE IF NOT EXISTS pii_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(50)  NOT NULL,   -- VIEW, EXPORT, MODIFY, DELETE, ANONYMIZE
    target_table    VARCHAR(100),            -- 대상 테이블
    target_id       BIGINT,                  -- 대상 레코드 ID
    field_name      VARCHAR(100),            -- 접근한 필드명
    actor_username  VARCHAR(50)  NOT NULL,   -- 수행자
    actor_ip        VARCHAR(45),             -- IP 주소
    detail          VARCHAR(500),            -- 상세 설명
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pii_audit_log_event_type ON pii_audit_log(event_type);
CREATE INDEX idx_pii_audit_log_actor ON pii_audit_log(actor_username);
CREATE INDEX idx_pii_audit_log_created_at ON pii_audit_log(created_at);

-- 개인정보 수집/이용 동의 이력
CREATE TABLE IF NOT EXISTS consent_history (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    consent_type    VARCHAR(50)  NOT NULL,   -- PRIVACY_POLICY, MARKETING, THIRD_PARTY
    consent_version VARCHAR(20)  NOT NULL,   -- 약관 버전
    consented       BOOLEAN      NOT NULL,   -- 동의 여부
    consented_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    CONSTRAINT fk_consent_user FOREIGN KEY (user_id) REFERENCES admin_user(seq_id)
);

CREATE INDEX idx_consent_history_user ON consent_history(user_id);
CREATE INDEX idx_consent_history_type ON consent_history(consent_type);
