-- Common Code Tables

CREATE TABLE common_code_group (
    seq_id BIGSERIAL PRIMARY KEY,
    group_code VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    use_yn CHAR(1) DEFAULT 'Y',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE common_code (
    seq_id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,
    code_name VARCHAR(200) NOT NULL,
    code_desc VARCHAR(500),
    use_yn CHAR(1) DEFAULT 'Y',
    sort_order INTEGER DEFAULT 0,
    extra1 VARCHAR(500),
    extra2 VARCHAR(500),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cc_group FOREIGN KEY (group_id) REFERENCES common_code_group(seq_id)
);
