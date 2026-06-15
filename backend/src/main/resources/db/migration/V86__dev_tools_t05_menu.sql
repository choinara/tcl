-- T05 세로통합 매트릭스 데모 (TS0060)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'TS0060', 'T05 세로통합 매트릭스', '/test/template-t05', 'TableRowsSplit', 6, 'Y', 2
FROM system_menu WHERE menu_code = 'DEV_TOOLS'
ON CONFLICT (menu_code) DO NOTHING;

-- 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'TS0060'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );

-- i18n (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.TS0060', 'T05 세로통합 매트릭스'),
('en', 'menu.TS0060', 'T05 Rowspan Matrix'),
('ja', 'menu.TS0060', 'T05 縦結合マトリクス'),
('zh', 'menu.TS0060', 'T05 纵向合并矩阵'),
('vi', 'menu.TS0060', 'T05 Ma trận hợp nhất dọc'),
('id', 'menu.TS0060', 'T05 Matriks Gabungan Vertikal'),
('th', 'menu.TS0060', 'T05 เมทริกซ์รวมแนวตั้ง')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
