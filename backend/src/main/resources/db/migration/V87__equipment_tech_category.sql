-- 설비기술 카테고리 등록

INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES ('ET_MGMT', '설비기술', NULL, 'zap', 7, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- 메뉴 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET_MGMT'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);

-- i18n 시드 (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET_MGMT', '설비기술'),
('en', 'menu.ET_MGMT', 'Equipment Tech'),
('ja', 'menu.ET_MGMT', '設備技術'),
('zh', 'menu.ET_MGMT', '设备技术'),
('vi', 'menu.ET_MGMT', 'Kỹ thuật thiết bị'),
('id', 'menu.ET_MGMT', 'Teknologi Peralatan'),
('th', 'menu.ET_MGMT', 'เทคโนโลยีอุปกรณ์')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
