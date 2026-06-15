-- equip_loss_event 테이블 (설비 Loss 이벤트)
CREATE TABLE IF NOT EXISTS equip_loss_event (
  id BIGSERIAL PRIMARY KEY,
  equip_id BIGINT,
  fail_date DATE NOT NULL,
  fail_time TIME,
  recovery_date DATE,
  recovery_time TIME,
  loss_time_min INTEGER DEFAULT 0,
  loss_type_code VARCHAR(50),
  shift_code VARCHAR(20),
  loss_cause TEXT,
  loss_action TEXT,
  remark TEXT,
  is_closed VARCHAR(1) NOT NULL DEFAULT 'N',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_equip_loss_event_equip_fail ON equip_loss_event(equip_id, fail_date);
CREATE INDEX IF NOT EXISTS idx_equip_loss_event_fail_date ON equip_loss_event(fail_date);

-- 시드 데이터: master_equipment 중 CU_NEG 설비에 대해 최근 3개월 loss 이벤트 약 30건
INSERT INTO equip_loss_event (equip_id, fail_date, fail_time, recovery_date, recovery_time, loss_time_min, loss_type_code, shift_code, loss_cause, loss_action, remark, is_closed)
SELECT
    me.seq_id,
    CURRENT_DATE - (gs * INTERVAL '3 days'),
    '08:30:00'::TIME,
    CURRENT_DATE - (gs * INTERVAL '3 days'),
    '10:00:00'::TIME,
    (30 + (gs * 7) % 120),
    CASE (gs % 5) WHEN 0 THEN 'MECH_FAIL' WHEN 1 THEN 'ELEC_FAIL' WHEN 2 THEN 'SOFT_FAIL' WHEN 3 THEN 'UTIL_FAIL' ELSE 'ETC_FAIL' END,
    CASE (gs % 4) WHEN 0 THEN 'A_SHIFT' WHEN 1 THEN 'B_SHIFT' WHEN 2 THEN 'C_SHIFT' ELSE 'D_SHIFT' END,
    '설비 이상 발생',
    '점검 후 재기동',
    '시드 데이터',
    'Y'
FROM master_equipment me
CROSS JOIN generate_series(1, 10) AS gs
WHERE me.category = 'CU_NEG'
LIMIT 30;
