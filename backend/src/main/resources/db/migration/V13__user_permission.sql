-- 사용자별 예외권한 테이블 (OrbitMES user_permissions 동일 구조)
CREATE TABLE user_permission (
    seq_id        BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT      NOT NULL,
    menu_id       BIGINT      NOT NULL,
    can_read      CHAR(1)     DEFAULT 'N' NOT NULL,
    can_create    CHAR(1)     DEFAULT 'N' NOT NULL,
    can_update    CHAR(1)     DEFAULT 'N' NOT NULL,
    can_delete    CHAR(1)     DEFAULT 'N' NOT NULL,
    can_export    CHAR(1)     DEFAULT 'N' NOT NULL,
    created_at    TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_up_user FOREIGN KEY (admin_user_id) REFERENCES admin_user(seq_id),
    CONSTRAINT fk_up_menu FOREIGN KEY (menu_id) REFERENCES system_menu(seq_id),
    CONSTRAINT uk_up_user_menu UNIQUE (admin_user_id, menu_id)
);

COMMENT ON TABLE user_permission IS '사용자별 예외권한 - 역할 권한을 덮어쓰는 사용자 개별 권한';
