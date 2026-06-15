-- 사용자별 열린 탭 세션 (재로그인/새로고침 시 복원)
CREATE TABLE user_open_tab (
    seq_id        BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT       NOT NULL,
    tab_path      VARCHAR(500) NOT NULL,
    menu_code     VARCHAR(20),
    sort_order    INT          NOT NULL DEFAULT 0,
    is_active     BOOLEAN      NOT NULL DEFAULT FALSE,
    label         VARCHAR(200),
    created_at    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(100),
    updated_by    VARCHAR(100),
    CONSTRAINT fk_uot_user FOREIGN KEY (admin_user_id) REFERENCES admin_user(seq_id),
    CONSTRAINT uk_uot_user_path UNIQUE (admin_user_id, tab_path)
);

CREATE INDEX idx_uot_user_sort ON user_open_tab (admin_user_id, sort_order);

COMMENT ON TABLE user_open_tab IS '사용자별 열린 탭 세션 (재로그인/새로고침 시 복원)';
