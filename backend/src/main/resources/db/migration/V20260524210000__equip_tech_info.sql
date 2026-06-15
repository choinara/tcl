-- ET0090: 설비기술기준정보 (MTBF/MTTR 관리 기준) 테이블
CREATE TABLE IF NOT EXISTS equip_tech_info (
  seq_id BIGSERIAL PRIMARY KEY,
  equip_category_code VARCHAR(30) NOT NULL,
  mtbf_target_min INTEGER DEFAULT 0,
  mtbf_ucl_min INTEGER DEFAULT 0,
  mtbf_loss_type_codes TEXT,
  mttr_target_min INTEGER DEFAULT 0,
  mttr_ucl_min INTEGER DEFAULT 0,
  mttr_loss_type_codes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_equip_tech_info_category ON equip_tech_info(equip_category_code);

-- EQUIP_CATEGORY 공통코드에 ALL 추가
INSERT INTO common_code (group_id, code, code_name, code_desc, use_yn, sort_order)
SELECT g.seq_id, 'ALL', '전체', '모든 설비 카테고리', 'Y', 3
FROM common_code_group g
WHERE g.group_code = 'EQUIP_CATEGORY'
AND NOT EXISTS (SELECT 1 FROM common_code WHERE group_id = g.seq_id AND code = 'ALL');

-- 초기 데이터 (각 설비 카테고리별 기본값)
INSERT INTO equip_tech_info(equip_category_code, mtbf_target_min, mtbf_ucl_min, mttr_target_min, mttr_ucl_min)
VALUES ('CU_NEG', 480, 720, 30, 60),
       ('AL_POS', 480, 720, 30, 60),
       ('ALL',    480, 720, 30, 60)
ON CONFLICT (equip_category_code) DO NOTHING;

-- ET0090 메뉴 등록 (설비기술기준정보)
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0090', '설비기술기준정보', '/et/tech-info', 'settings', 9, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- ET0090 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0090' AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (SELECT 1 FROM menu_role_permission mrp WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id);

-- ET0090 i18n
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0090', '설비기술기준정보'),
('en', 'menu.ET0090', 'Equipment Tech Standards'),
('ja', 'menu.ET0090', '設備技術基準情報'),
('zh', 'menu.ET0090', '设备技术标准信息'),
('vi', 'menu.ET0090', 'Thong tin tieu chuan ky thuat'),
('id', 'menu.ET0090', 'Standar Teknis Peralatan'),
('th', 'menu.ET0090', 'ข้อมูลมาตรฐานเทคนิค')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
