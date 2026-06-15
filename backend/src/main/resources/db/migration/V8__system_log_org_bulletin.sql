-- =============================================
-- V8: 시스템로그, 조직관리(부서/회사/직급), 게시판
-- =============================================

-- 1. 시스템 로그
CREATE TABLE system_log (
    seq_id      BIGSERIAL PRIMARY KEY,
    log_type    VARCHAR(30)  NOT NULL,          -- LOGIN, LOGOUT, LOGIN_FAIL, USER_MGMT, SYSTEM, ERROR
    user_id     BIGINT,
    username    VARCHAR(50),
    ip_address  VARCHAR(45),
    action      VARCHAR(200),
    detail      TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_system_log_type ON system_log (log_type);
CREATE INDEX idx_system_log_created ON system_log (created_at DESC);
CREATE INDEX idx_system_log_username ON system_log (username);

-- 2. 부서
CREATE TABLE department (
    seq_id          BIGSERIAL PRIMARY KEY,
    dept_code       VARCHAR(50)  NOT NULL UNIQUE,
    dept_name       VARCHAR(100) NOT NULL,
    company_id      BIGINT,
    parent_id       BIGINT,
    dept_level      INTEGER      NOT NULL DEFAULT 1,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    manager_name    VARCHAR(100),
    phone           VARCHAR(30),
    location        VARCHAR(200),
    is_active       CHAR(1)      NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 3. 회사
CREATE TABLE company (
    seq_id          BIGSERIAL PRIMARY KEY,
    company_code    VARCHAR(50)  NOT NULL UNIQUE,
    company_name    VARCHAR(200) NOT NULL,
    company_type    VARCHAR(50),
    parent_id       BIGINT,
    country         VARCHAR(50),
    address         VARCHAR(500),
    phone           VARCHAR(30),
    fax             VARCHAR(30),
    ceo_name        VARCHAR(100),
    business_number VARCHAR(30),
    is_active       CHAR(1)      NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. 직급
CREATE TABLE position (
    seq_id          BIGSERIAL PRIMARY KEY,
    position_code   VARCHAR(50)  NOT NULL UNIQUE,
    position_name   VARCHAR(100) NOT NULL,
    position_level  INTEGER      NOT NULL DEFAULT 1,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    is_active       CHAR(1)      NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 5. 게시판
CREATE TABLE system_bulletin (
    seq_id          BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    popup_on_login  CHAR(1)      NOT NULL DEFAULT 'Y',
    valid_from      DATE,
    valid_to        DATE,
    is_active       CHAR(1)      NOT NULL DEFAULT 'Y',
    created_by      VARCHAR(50),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 6. admin_user에 부서/회사/직급 FK 컬럼 추가
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS company_id    BIGINT;
ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS position_id   BIGINT;

-- 7. 시스템로그 메뉴 코드 추가 (SM0090)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0090', '시스템로그', '/system/logs', 'FileText', 9, 'Y', 2
FROM system_menu WHERE menu_code = 'SYS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN에 새 메뉴 권한 부여
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'SM0090' AND r.role_code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- 공통코드: 부서레벨, 회사유형
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order) VALUES
('DEPT_LEVEL', '부서레벨', '부서 계층 레벨', 'Y', 10),
('COMPANY_TYPE', '회사유형', '회사 분류', 'Y', 11)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'L1', '본부', 'Y', 1 FROM common_code_group WHERE group_code = 'DEPT_LEVEL';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'L2', '팀', 'Y', 2 FROM common_code_group WHERE group_code = 'DEPT_LEVEL';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'L3', '파트', 'Y', 3 FROM common_code_group WHERE group_code = 'DEPT_LEVEL';

INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'HQ', '본사', 'Y', 1 FROM common_code_group WHERE group_code = 'COMPANY_TYPE';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'BRANCH', '지사', 'Y', 2 FROM common_code_group WHERE group_code = 'COMPANY_TYPE';
INSERT INTO common_code (group_id, code, code_name, use_yn, sort_order)
SELECT seq_id, 'SUBSIDIARY', '자회사', 'Y', 3 FROM common_code_group WHERE group_code = 'COMPANY_TYPE';
