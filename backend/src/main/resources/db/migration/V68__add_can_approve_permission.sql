-- 승인 권한 컬럼 추가 (기존 6종 + canApprove = 7종)
ALTER TABLE menu_role_permission
  ADD COLUMN IF NOT EXISTS can_approve CHAR(1) NOT NULL DEFAULT 'N';

ALTER TABLE user_permission
  ADD COLUMN IF NOT EXISTS can_approve CHAR(1) NOT NULL DEFAULT 'N';

-- 기존 WH0010에 canUpdate='Y'인 역할에 can_approve='Y'도 자동 부여
-- (기존에 승인이 가능했던 역할의 권한 소멸 방지)
UPDATE menu_role_permission
SET can_approve = 'Y'
WHERE menu_id = (SELECT seq_id FROM system_menu WHERE menu_code = 'WH0010')
  AND can_update = 'Y';

COMMENT ON COLUMN menu_role_permission.can_approve IS '승인 권한 (Y/N)';
COMMENT ON COLUMN user_permission.can_approve IS '승인 권한 (Y/N)';

-- 승인자/승인일시 추적 필드
ALTER TABLE wh_pre_inbound
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(50),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

CREATE INDEX idx_wh_pre_inbound_approved ON wh_pre_inbound(approved_by) WHERE approved_by IS NOT NULL;
