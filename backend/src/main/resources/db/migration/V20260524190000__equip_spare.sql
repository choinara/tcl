-- ET0050: 설비 Spare 관리 테이블
CREATE TABLE IF NOT EXISTS equip_spare (
  seq_id BIGSERIAL PRIMARY KEY,
  spare_code VARCHAR(30) NOT NULL,
  spare_name VARCHAR(200) NOT NULL,
  spare_spec VARCHAR(200),
  unit VARCHAR(50),
  unit_price NUMERIC(15,2),
  stock_qty NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock_qty NUMERIC(10,2) NOT NULL DEFAULT 0,
  spare_type_code VARCHAR(30),
  equip_category_code VARCHAR(30),
  is_active VARCHAR(1) NOT NULL DEFAULT 'Y',
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_equip_spare_spare_code ON equip_spare(spare_code);

-- Spare 입출고 이력
CREATE TABLE IF NOT EXISTS equip_spare_inout (
  seq_id BIGSERIAL PRIMARY KEY,
  spare_id BIGINT NOT NULL,
  inout_type VARCHAR(10) NOT NULL,
  qty NUMERIC(10,2) NOT NULL,
  inout_date DATE NOT NULL,
  used_equip_id BIGINT,
  reason VARCHAR(500),
  inout_by VARCHAR(100),
  remark TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_equip_spare_inout_spare_id ON equip_spare_inout(spare_id);
CREATE INDEX IF NOT EXISTS ix_equip_spare_inout_inout_date ON equip_spare_inout(inout_date);

-- ET0050 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0050', '설비 Spare 관리', '/et/spare', 'package', 5, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0050 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0050' AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (SELECT 1 FROM menu_role_permission mrp WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id);

-- ET0050 i18n
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0050', '설비 Spare 관리'),
('en', 'menu.ET0050', 'Spare Parts Management'),
('ja', 'menu.ET0050', '設備スペア管理'),
('zh', 'menu.ET0050', '设备备件管理'),
('vi', 'menu.ET0050', 'Quản lý phụ tùng'),
('id', 'menu.ET0050', 'Manajemen Suku Cadang'),
('th', 'menu.ET0050', 'จัดการอะไหล่')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
