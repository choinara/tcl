-- User Preference Table

CREATE TABLE user_preference (
    seq_id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    pref_key VARCHAR(100) NOT NULL,
    pref_value TEXT,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_up_user FOREIGN KEY (admin_user_id) REFERENCES admin_user(seq_id),
    CONSTRAINT uk_user_pref_key UNIQUE (admin_user_id, pref_key)
);
