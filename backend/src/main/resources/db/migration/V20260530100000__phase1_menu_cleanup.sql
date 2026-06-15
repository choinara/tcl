-- Phase 1 메뉴 정비
-- 1. AA0021(Asset Instance 관리_old) → DEV_TOOLS 이동 (UI 템플릿으로 보존)
-- 2. AA0060(AAS 연계) → DEV_TOOLS 이동 (UI 템플릿으로 보존)

-- 1. AA0021 DEV_TOOLS 이동
UPDATE system_menu
SET parent_id   = (SELECT seq_id FROM system_menu WHERE menu_code = 'DEV_TOOLS'),
    menu_name   = 'Asset Instance UI (템플릿)',
    menu_path   = '/test/asset-instance-ui',
    sort_order  = 21,
    use_yn      = 'Y'
WHERE menu_code = 'AA0021';

INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
  ('ko', 'menu.AA0021', 'Asset Instance UI (템플릿)'),
  ('en', 'menu.AA0021', 'Asset Instance UI (Template)'),
  ('ja', 'menu.AA0021', 'Asset Instance UI（テンプレート）'),
  ('zh', 'menu.AA0021', 'Asset Instance UI（模板）'),
  ('vi', 'menu.AA0021', 'Asset Instance UI (Mẫu)'),
  ('id', 'menu.AA0021', 'Asset Instance UI (Template)'),
  ('th', 'menu.AA0021', 'Asset Instance UI (แม่แบบ)')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- 2. AA0060 DEV_TOOLS 이동
UPDATE system_menu
SET parent_id   = (SELECT seq_id FROM system_menu WHERE menu_code = 'DEV_TOOLS'),
    menu_name   = 'AAS 트리 UI (템플릿)',
    menu_path   = '/test/aas-linkage-ui',
    sort_order  = 20
WHERE menu_code = 'AA0060';

-- 3. AA0060 i18n 갱신
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
  ('ko', 'menu.AA0060', 'AAS 트리 UI (템플릿)'),
  ('en', 'menu.AA0060', 'AAS Tree UI (Template)'),
  ('ja', 'menu.AA0060', 'AAS ツリー UI（テンプレート）'),
  ('zh', 'menu.AA0060', 'AAS 树形 UI（模板）'),
  ('vi', 'menu.AA0060', 'AAS Tree UI (Mẫu)'),
  ('id', 'menu.AA0060', 'AAS Tree UI (Template)'),
  ('th', 'menu.AA0060', 'AAS Tree UI (แม่แบบ)')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
