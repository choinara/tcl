-- L1-A 인라인 편집 데모 (TS0020)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'TS0020', 'L1-A 인라인 편집', '/test/template-l1a', 'TableProperties', 2, 'Y', 2
FROM system_menu WHERE menu_code = 'DEV_TOOLS'
ON CONFLICT (menu_code) DO NOTHING;

-- L1-B 팝업 편집 데모 (TS0030)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'TS0030', 'L1-B 팝업 편집', '/test/template-l1b', 'PanelTop', 3, 'Y', 2
FROM system_menu WHERE menu_code = 'DEV_TOOLS'
ON CONFLICT (menu_code) DO NOTHING;

-- L2 분할 그리드 데모 (TS0040)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'TS0040', 'L2 분할 그리드', '/test/template-l2', 'Rows2', 4, 'Y', 2
FROM system_menu WHERE menu_code = 'DEV_TOOLS'
ON CONFLICT (menu_code) DO NOTHING;

-- 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code IN ('TS0020', 'TS0030', 'TS0040')
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );

-- i18n (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.TS0020', 'L1-A 인라인 편집'),
('en', 'menu.TS0020', 'L1-A Inline Edit'),
('ja', 'menu.TS0020', 'L1-A インライン編集'),
('zh', 'menu.TS0020', 'L1-A 内联编辑'),
('vi', 'menu.TS0020', 'L1-A Chỉnh sửa nội tuyến'),
('id', 'menu.TS0020', 'L1-A Edit Inline'),
('th', 'menu.TS0020', 'L1-A แก้ไขแบบอินไลน์'),
('ko', 'menu.TS0030', 'L1-B 팝업 편집'),
('en', 'menu.TS0030', 'L1-B Popup Edit'),
('ja', 'menu.TS0030', 'L1-B ポップアップ編集'),
('zh', 'menu.TS0030', 'L1-B 弹窗编辑'),
('vi', 'menu.TS0030', 'L1-B Chỉnh sửa Popup'),
('id', 'menu.TS0030', 'L1-B Edit Popup'),
('th', 'menu.TS0030', 'L1-B แก้ไขแบบป๊อปอัป'),
('ko', 'menu.TS0040', 'L2 분할 그리드'),
('en', 'menu.TS0040', 'L2 Split Grid'),
('ja', 'menu.TS0040', 'L2 分割グリッド'),
('zh', 'menu.TS0040', 'L2 分割网格'),
('vi', 'menu.TS0040', 'L2 Lưới chia đôi'),
('id', 'menu.TS0040', 'L2 Grid Terbagi'),
('th', 'menu.TS0040', 'L2 กริดแยก')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
