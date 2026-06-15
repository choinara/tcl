-- menu_memo 테이블 생성 (V63에서 dev_memo DROP 후 누락된 DDL 보완)
CREATE TABLE IF NOT EXISTS menu_memo (
    seq_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    menu_code   VARCHAR(20)  NOT NULL,
    author      VARCHAR(100) NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(50),
    updated_by  VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_menu_memo_menu_code ON menu_memo (menu_code);
