-- V69: 이메일관리 메뉴(EM 상위 + EM0010~EM0050) + 권한 INSERT + ShedLock + email_message + email_attachment

-- 1) 메뉴 등록 (EM 카테고리 상위 + 5개 페이지)
INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES
  (NULL, 'EM', '이메일관리', NULL, 'mail', 110, 'Y', 1);

INSERT INTO system_menu (parent_id, menu_code, menu_name, menu_path, icon, sort_order, use_yn, menu_level)
VALUES
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'EM'), 'EM0010', '이메일목록',         '/email/list',                       'mail',  10, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'EM'), 'EM0020', '라벨매핑',           '/email/settings/labels',            'tag',   20, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'EM'), 'EM0030', '고객사이메일매핑',   '/email/settings/customer-mapping',  'users', 30, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'EM'), 'EM0040', '메일계정인증',       '/email/settings/oauth',             'lock',  40, 'Y', 2),
  ((SELECT seq_id FROM system_menu WHERE menu_code = 'EM'), 'EM0050', 'AI사용량',           '/email/settings/ai-usage',          'chart', 50, 'Y', 2);

-- 2) SUPER_ADMIN, ADMIN 역할에 권한 부여 (V64 CROSS JOIN INSERT 패턴)
-- 5종(read/create/update/delete/export): 'Y' 일괄
-- can_view_pii: SUPER_ADMIN만 'Y', ADMIN 'N' (SystemMenuController.grantDefaultPermissions() 정책 일치)
-- can_approve: INSERT 디폴트 'N' (SystemMenuController 정책 일치, 별도 UPDATE로 부여)
INSERT INTO menu_role_permission (menu_id, admin_role_id, can_read, can_create, can_update, can_delete, can_export, can_view_pii, can_approve)
SELECT m.seq_id, r.seq_id, 'Y', 'Y', 'Y', 'Y', 'Y',
       CASE WHEN r.role_code = 'SUPER_ADMIN' THEN 'Y' ELSE 'N' END,
       'N'
FROM system_menu m
CROSS JOIN admin_role r
WHERE m.menu_code IN ('EM', 'EM0010', 'EM0020', 'EM0030', 'EM0040', 'EM0050')
  AND r.role_code IN ('SUPER_ADMIN', 'ADMIN');

-- 3) 이메일관리 도메인 승인 워크플로우 핵심성 반영 (V68 WH0010 패턴 모방)
--    SUPER_ADMIN, ADMIN 두 역할에 EM 6개 메뉴 can_approve='Y' 부여
UPDATE menu_role_permission
SET can_approve = 'Y'
WHERE menu_id IN (
        SELECT seq_id FROM system_menu
        WHERE menu_code IN ('EM', 'EM0010', 'EM0020', 'EM0030', 'EM0040', 'EM0050')
      )
  AND admin_role_id IN (
        SELECT seq_id FROM admin_role
        WHERE role_code IN ('SUPER_ADMIN', 'ADMIN')
      );

-- 4) ShedLock 테이블 (스케줄러 분산 락)
CREATE TABLE IF NOT EXISTS shedlock(
  name VARCHAR(64) NOT NULL PRIMARY KEY,
  lock_until TIMESTAMP NOT NULL,
  locked_at  TIMESTAMP NOT NULL,
  locked_by  VARCHAR(255) NOT NULL
);

-- 5) email_message
CREATE TABLE email_message (
  id BIGSERIAL PRIMARY KEY,
  gmail_message_id VARCHAR(64) NOT NULL,
  gmail_thread_id  VARCHAR(64),
  account_id       BIGINT NOT NULL,
  subject          VARCHAR(998),
  sender_email     VARCHAR(320),
  sender_name      VARCHAR(200),
  recipient        VARCHAR(2000),
  cc               VARCHAR(2000),
  received_at      TIMESTAMPTZ NOT NULL,
  label            VARCHAR(200),
  body_text        TEXT,
  body_html        TEXT,
  size_bytes       BIGINT,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  customer_code    VARCHAR(50),
  customer_name    VARCHAR(200),
  partner_code     VARCHAR(50),
  partner_name     VARCHAR(200),
  assignee_user_id BIGINT,
  classification_purpose     VARCHAR(50),
  classification_confidence  NUMERIC(4,3),
  ai_processed_at  TIMESTAMPTZ,
  approved_at      TIMESTAMPTZ,
  approved_by      VARCHAR(100),
  rejected_by      VARCHAR(100),
  rejected_at      TIMESTAMPTZ,
  reject_reason    VARCHAR(500),
  retention_until  TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       VARCHAR(100),
  updated_by       VARCHAR(100),
  CONSTRAINT uq_email_message_gmail UNIQUE (gmail_message_id, account_id)
);
CREATE INDEX idx_email_message_status ON email_message (processing_status, received_at DESC);
CREATE INDEX idx_email_message_retention ON email_message (retention_until);

-- 6) email_attachment
CREATE TABLE email_attachment (
  id BIGSERIAL PRIMARY KEY,
  email_message_id BIGINT NOT NULL,
  file_name        VARCHAR(500),
  mime_type        VARCHAR(100),
  size_bytes       BIGINT,
  storage_path     VARCHAR(1000),
  storage_filename VARCHAR(64),
  extracted_data   JSONB,
  av_scan_status   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  av_scan_at       TIMESTAMPTZ,
  av_scan_result   VARCHAR(500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       VARCHAR(100),
  updated_by       VARCHAR(100)
);
CREATE INDEX idx_email_attachment_message ON email_attachment (email_message_id);
CREATE INDEX idx_email_attachment_av ON email_attachment (av_scan_status);
