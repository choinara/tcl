-- Admin User Management Tables

CREATE TABLE admin_user (
    seq_id BIGSERIAL PRIMARY KEY,
    team_id BIGINT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone_number VARCHAR(20),
    birthday DATE,
    postal_code VARCHAR(10),
    address_base VARCHAR(500),
    address_detail VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    qu_msg_yn CHAR(1) DEFAULT 'N',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP(6)
);

CREATE TABLE admin_role (
    seq_id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_user_role (
    seq_id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    admin_role_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aur_user FOREIGN KEY (admin_user_id) REFERENCES admin_user(seq_id),
    CONSTRAINT fk_aur_role FOREIGN KEY (admin_role_id) REFERENCES admin_role(seq_id),
    CONSTRAINT uk_user_role UNIQUE (admin_user_id, admin_role_id)
);

CREATE TABLE admin_user_session (
    admin_user_id BIGINT PRIMARY KEY,
    access_token VARCHAR(1000),
    access_token_expires_at TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aus_user FOREIGN KEY (admin_user_id) REFERENCES admin_user(seq_id)
);

CREATE TABLE admin_user_bank_account (
    seq_id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    bank_code VARCHAR(10),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder VARCHAR(100),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auba_user FOREIGN KEY (admin_user_id) REFERENCES admin_user(seq_id)
);

CREATE TABLE team_info (
    seq_id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT,
    code VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    is_active CHAR(1) DEFAULT 'Y',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);
