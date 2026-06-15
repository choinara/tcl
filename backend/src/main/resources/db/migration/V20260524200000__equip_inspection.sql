-- ET0020: 정기검사 일정/결과 테이블
CREATE TABLE IF NOT EXISTS equip_inspection (
  seq_id BIGSERIAL PRIMARY KEY,
  equip_id BIGINT,
  inspect_date DATE NOT NULL,
  inspector VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_equip_inspection_equip_id ON equip_inspection(equip_id);
CREATE INDEX IF NOT EXISTS ix_equip_inspection_inspect_date ON equip_inspection(inspect_date);

-- ET0020: 검사 항목 결과 테이블
CREATE TABLE IF NOT EXISTS equip_inspection_result (
  seq_id BIGSERIAL PRIMARY KEY,
  inspection_id BIGINT NOT NULL,
  item_no INTEGER NOT NULL,
  result_code VARCHAR(30),
  note VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_equip_inspection_result_inspection_id ON equip_inspection_result(inspection_id);

-- 정기검사 항목 공통코드 시드 (INSPECT_ITEM: 18개 고정 항목)
INSERT INTO common_code_group (group_code, group_name, description, use_yn, sort_order)
VALUES ('INSPECT_ITEM', '정기검사항목', '정기검사 18개 점검 항목', 'Y', 105)
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, v.code, v.code_name, v.code_desc, 'Y', v.sort_order
FROM common_code_group g,
(VALUES
  ('ITEM_01', '블록수평(앞)', '진접공정 - 블록수평(앞)', 1),
  ('ITEM_02', '블록수평(뒤)', '진접공정 - 블록수평(뒤)', 2),
  ('ITEM_03', '블록넓이(상부)', '블록 넓이 - 22mm(상부)', 3),
  ('ITEM_04', '블록넓이(하부)', '블록 넓이 - 22mm(하부)', 4),
  ('ITEM_05', '실리콘교체(상부)', '진접 실리콘 - 1일교체확인(상부)', 5),
  ('ITEM_06', '실리콘교체(하부)', '진접 실리콘 - 1일교체확인(하부)', 6),
  ('ITEM_07', 'Teflon실런트(상부)', 'Teflon tape - 실런트부(상부)', 7),
  ('ITEM_08', 'Teflon실런트(하부)', 'Teflon tape - 실런트부(하부)', 8),
  ('ITEM_09', 'AL표면처리규격', '자재투입부 - AL(표면처리,규격)', 9),
  ('ITEM_10', 'Nicu규격표면', '자재투입부 - Nicu(규격,표면)', 10),
  ('ITEM_11', 'Film두께', '자재투입부 - Film 총두께 0.102이하', 11),
  ('ITEM_12', '최적조건', '설정조건 - 시간,온도,압력', 12),
  ('ITEM_13', 'Suction(상부)', '필름공급부 - Suction이상(상부)', 13),
  ('ITEM_14', 'Suction(하부)', '필름공급부 - Suction이상(하부)', 14),
  ('ITEM_15', '이물질1차(상부)', '이물질방지 - 1차Metal(상부)', 15),
  ('ITEM_16', '이물질1차(하부)', '이물질방지 - 1차Metal(하부)', 16),
  ('ITEM_17', '이물질2차(상부)', '이물질방지 - 1차Metal(상부)', 17),
  ('ITEM_18', '이물질2차(하부)', '이물질방지 - 1차Metal(하부)', 18)
) AS v(code, code_name, code_desc, sort_order)
WHERE g.group_code = 'INSPECT_ITEM'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = v.code);

-- ET0010 메뉴 등록 (설비보전이력관리)
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0010', '설비보전이력관리', '/et/maintenance', 'shield', 1, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0010 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0010' AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (SELECT 1 FROM menu_role_permission mrp WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id);

-- ET0010 i18n
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0010', '설비보전이력관리'),
('en', 'menu.ET0010', 'Maintenance History'),
('ja', 'menu.ET0010', '設備保全履歴管理'),
('zh', 'menu.ET0010', '设备保全历史管理'),
('vi', 'menu.ET0010', 'Quản ly lich su bao tri'),
('id', 'menu.ET0010', 'Riwayat Pemeliharaan'),
('th', 'menu.ET0010', 'ประวัติการบำรุงรักษา')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;

-- ET0020 메뉴 등록 (정기검사관리)
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0020', '정기검사관리', '/et/inspection', 'clipboard-check', 2, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0020 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0020' AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (SELECT 1 FROM menu_role_permission mrp WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id);

-- ET0020 i18n
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0020', '정기검사관리'),
('en', 'menu.ET0020', 'Periodic Inspection'),
('ja', 'menu.ET0020', '定期検査管理'),
('zh', 'menu.ET0020', '定期检查管理'),
('vi', 'menu.ET0020', 'Quản ly kiem tra dinh ky'),
('id', 'menu.ET0020', 'Inspeksi Berkala'),
('th', 'menu.ET0020', 'การตรวจสอบตามกำหนด')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
