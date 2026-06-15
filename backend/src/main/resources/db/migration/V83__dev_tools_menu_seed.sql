-- 개발도구 그룹 메뉴 등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES (NULL, 'DEV_TOOLS', '개발도구', NULL, 'Wrench', 99, 'Y', 1)
ON CONFLICT (menu_code) DO NOTHING;

-- TS0010 컴포넌트 쇼케이스 등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'TS0010', '컴포넌트 쇼케이스', '/test/components', 'LayoutDashboard', 1, 'Y', 2
FROM system_menu WHERE menu_code = 'DEV_TOOLS'
ON CONFLICT (menu_code) DO NOTHING;

-- 메뉴 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'TS0010'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
);

-- i18n 시드 (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.DEV_TOOLS', '개발도구'),
('en', 'menu.DEV_TOOLS', 'Dev Tools'),
('ja', 'menu.DEV_TOOLS', '開発ツール'),
('zh', 'menu.DEV_TOOLS', '开发工具'),
('vi', 'menu.DEV_TOOLS', 'Công cụ Dev'),
('id', 'menu.DEV_TOOLS', 'Alat Dev'),
('th', 'menu.DEV_TOOLS', 'เครื่องมือ Dev'),
('ko', 'menu.TS0010', '컴포넌트 쇼케이스'),
('en', 'menu.TS0010', 'Component Showcase'),
('ja', 'menu.TS0010', 'コンポーネント一覧'),
('zh', 'menu.TS0010', '组件展示'),
('vi', 'menu.TS0010', 'Showcase Thành phần'),
('id', 'menu.TS0010', 'Showcase Komponen'),
('th', 'menu.TS0010', 'Showcase คอมโพเนนต์')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
