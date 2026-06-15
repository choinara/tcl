-- AA0090 수집모니터링2 (Pipeline Monitor) 메뉴 등록
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
SELECT seq_id, 'AA0090', '수집모니터링2', '/aas/pipeline-monitor', 'Monitor', 9, 'Y', 2
FROM system_menu WHERE menu_code = 'AAS_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 권한 등록 (SUPER_ADMIN, ADMIN)
-- can_create=N, can_export=N: 읽기 전용 인프라 대시보드. 수집 데이터 생성/내보내기 기능 없음.
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'N', 'Y', 'Y', 'N', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'AA0090'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM menu_role_permission mrp
    WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );

-- i18n 메뉴명 (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.AA0090', '수집모니터링2'),
('en', 'menu.AA0090', 'Pipeline Monitor'),
('ja', 'menu.AA0090', 'パイプラインモニター'),
('zh', 'menu.AA0090', '管道监控'),
('vi', 'menu.AA0090', 'Giám sát đường ống'),
('id', 'menu.AA0090', 'Monitor Pipeline'),
('th', 'menu.AA0090', 'มอนิเตอร์ไปป์ไลน์')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
