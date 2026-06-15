-- AA0020 Asset Instance 재설계 (Q4: 기존 데이터 전부 삭제)
DELETE FROM asset_instance;

-- 불필요 컬럼 제거
ALTER TABLE asset_instance DROP COLUMN IF EXISTS extra_fields;
ALTER TABLE asset_instance DROP COLUMN IF EXISTS opcua_node_count;

-- type_code NOT NULL 제약 완화 (선택사항)
ALTER TABLE asset_instance ALTER COLUMN type_code DROP NOT NULL;

-- 신규 컬럼 추가
ALTER TABLE asset_instance
    ADD COLUMN IF NOT EXISTS linked_menu_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS linked_record_id BIGINT,
    ADD COLUMN IF NOT EXISTS link_status      VARCHAR(20) NOT NULL DEFAULT 'STANDALONE',
    ADD COLUMN IF NOT EXISTS linked_columns   JSONB       NOT NULL DEFAULT '[]'::jsonb;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_asset_instance_menu_record
    ON asset_instance(linked_menu_code, linked_record_id);
CREATE INDEX IF NOT EXISTS idx_asset_instance_link_status
    ON asset_instance(link_status);

-- Q7 B안: 메뉴 단위 컬럼 설정 전역 저장
CREATE TABLE IF NOT EXISTS asset_instance_menu_col_config (
    menu_code   VARCHAR(50)  PRIMARY KEY,
    col_keys    JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(50),
    updated_by  VARCHAR(50)
);
