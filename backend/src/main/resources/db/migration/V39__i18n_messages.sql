-- ============================================================
-- Part F: 다국어 관리 (i18n)
-- ============================================================

CREATE TABLE i18n_message (
    seq_id          BIGSERIAL PRIMARY KEY,
    lang_code       VARCHAR(10)  NOT NULL,
    message_key     VARCHAR(500) NOT NULL,
    message_value   TEXT,
    is_active       VARCHAR(1) NOT NULL DEFAULT 'Y',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lang_code, message_key)
);

CREATE INDEX idx_i18n_message_lang ON i18n_message (lang_code);
CREATE INDEX idx_i18n_message_key ON i18n_message (message_key);

-- 메뉴 등록 (시스템관리 하위)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'SM0100', '다국어관리', '/system/i18n', 'Languages', 10, 'Y', 2
FROM system_menu WHERE menu_code = 'SYSTEM_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- SUPER_ADMIN 권한
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'SM0100'
AND r.role_code = 'SUPER_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);
