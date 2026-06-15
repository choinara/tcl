-- ET0110 설비가동계획 테이블
CREATE TABLE IF NOT EXISTS equip_operation_plan (
    id              BIGSERIAL    PRIMARY KEY,
    equip_id        BIGINT       NOT NULL,
    plan_date       DATE         NOT NULL,
    event_type_code VARCHAR(30),
    event_content   VARCHAR(200),
    std_time_h      NUMERIC(5,2) DEFAULT 0,
    start_time      TIME,
    end_time        TIME,
    avail_time_h    NUMERIC(5,2) DEFAULT 24,
    remark          TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_eop_equip_date ON equip_operation_plan (equip_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_eop_plan_date  ON equip_operation_plan (plan_date);

-- ET0110 메뉴 등록
INSERT INTO system_menu (menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level, parent_id)
SELECT 'ET0110', '설비가동계획', '/et/operation-plan', 'calendar', 11, 'Y', 2, m.seq_id
FROM system_menu m WHERE m.menu_code = 'ET_MGMT'
ON CONFLICT (menu_code) DO NOTHING;

-- 권한 등록 (SUPER_ADMIN, ADMIN)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N'
FROM system_menu m, admin_role r
WHERE m.menu_code = 'ET0110'
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND NOT EXISTS (
      SELECT 1 FROM menu_role_permission mrp
      WHERE mrp.menu_id = m.seq_id AND mrp.admin_role_id = r.seq_id
  );

-- 공통코드 그룹: EQUIP_PLAN_EVENT
INSERT INTO common_code_group (group_code, group_name, use_yn)
VALUES ('EQUIP_PLAN_EVENT', '설비계획이벤트유형', 'Y')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO common_code (group_id, code, code_name, sort_order, use_yn)
SELECT g.seq_id, v.code, v.code_name, v.sort_order, 'Y'
FROM common_code_group g,
(VALUES
  ('PM',         '예방보전(PM)',     1),
  ('BM',         '고장보전(BM)',     2),
  ('PD',         '계획비가동(PD)',   3),
  ('MAT_CHANGE', '자재교체',        4),
  ('TACT_DELAY', 'Tact time 지연', 5),
  ('OTHER',      '기타',            6)
) AS v(code, code_name, sort_order)
WHERE g.group_code = 'EQUIP_PLAN_EVENT'
  AND NOT EXISTS (
      SELECT 1 FROM common_code c WHERE c.group_id = g.seq_id AND c.code = v.code
  );

-- i18n (7개 언어)
INSERT INTO i18n_message (lang_code, message_key, message_value) VALUES
('ko', 'menu.ET0110', '설비가동계획'),
('en', 'menu.ET0110', 'Equipment Operation Plan'),
('ja', 'menu.ET0110', '設備稼働計画'),
('zh', 'menu.ET0110', '设备运行计划'),
('vi', 'menu.ET0110', 'Equipment Operation Plan'),
('id', 'menu.ET0110', 'Equipment Operation Plan'),
('th', 'menu.ET0110', 'Equipment Operation Plan')
ON CONFLICT (lang_code, message_key) DO UPDATE SET message_value = EXCLUDED.message_value;
