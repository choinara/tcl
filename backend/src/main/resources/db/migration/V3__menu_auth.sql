-- Menu & Permission Tables

CREATE TABLE system_menu (
    seq_id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT,
    menu_code VARCHAR(50) NOT NULL UNIQUE,
    menu_name VARCHAR(200) NOT NULL,
    menu_path VARCHAR(500),
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    use_yn CHAR(1) DEFAULT 'Y',
    menu_level INTEGER DEFAULT 1,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_role_permission (
    seq_id BIGSERIAL PRIMARY KEY,
    menu_id BIGINT NOT NULL,
    admin_role_id BIGINT NOT NULL,
    can_read CHAR(1) DEFAULT 'N',
    can_create CHAR(1) DEFAULT 'N',
    can_update CHAR(1) DEFAULT 'N',
    can_delete CHAR(1) DEFAULT 'N',
    can_export CHAR(1) DEFAULT 'N',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mrp_menu FOREIGN KEY (menu_id) REFERENCES system_menu(seq_id),
    CONSTRAINT fk_mrp_role FOREIGN KEY (admin_role_id) REFERENCES admin_role(seq_id)
);
