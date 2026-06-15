-- ET0030: 설비고장/수리이력 테이블
CREATE TABLE IF NOT EXISTS equip_repair_hist (
  seq_id BIGSERIAL PRIMARY KEY,
  repair_no VARCHAR(20) NOT NULL,
  equip_id BIGINT,
  fail_date DATE,
  repair_start_date DATE,
  repair_end_date DATE,
  fail_desc TEXT,
  repair_desc TEXT,
  repair_person VARCHAR(100),
  repair_time NUMERIC(6,2),
  repair_cost NUMERIC(15,2),
  fail_type_code VARCHAR(30),
  shift_code VARCHAR(30),
  is_closed VARCHAR(1) NOT NULL DEFAULT 'N',
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_equip_repair_hist_repair_no ON equip_repair_hist(repair_no);
CREATE INDEX IF NOT EXISTS ix_equip_repair_hist_equip_id ON equip_repair_hist(equip_id);
CREATE INDEX IF NOT EXISTS ix_equip_repair_hist_fail_date ON equip_repair_hist(fail_date);

-- ET0030 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0030', '설비고장/수리이력', '/et/repair-hist', 'wrench', 3, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0030 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0030' AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (SELECT 1 FROM menu_role_permission mrp WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id);

-- ET0030 i18n
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0030', '설비고장/수리이력'),
('en', 'menu.ET0030', 'Repair History'),
('ja', 'menu.ET0030', '設備故障・修理履歴'),
('zh', 'menu.ET0030', '设备故障/维修历史'),
('vi', 'menu.ET0030', 'Lịch sử sửa chữa'),
('id', 'menu.ET0030', 'Riwayat Perbaikan'),
('th', 'menu.ET0030', 'ประวัติการซ่อม')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
