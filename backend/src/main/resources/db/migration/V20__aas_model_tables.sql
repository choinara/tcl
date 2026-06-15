-- ============================================================
-- V20: AAS 모델 관리 테이블 (AASX 파일, Shell, Submodel, Element)
-- ============================================================

-- AASX 파일 업로드 관리
CREATE TABLE IF NOT EXISTS aasx_file (
    seq_id          BIGSERIAL PRIMARY KEY,
    file_name       VARCHAR(255) NOT NULL,
    file_hash       VARCHAR(64),
    file_path       VARCHAR(500),
    file_size       BIGINT,
    aas_version     VARCHAR(20) DEFAULT '3.0',
    shell_count     INT DEFAULT 0,
    submodel_count  INT DEFAULT 0,
    element_count   INT DEFAULT 0,
    use_yn          CHAR(1) DEFAULT 'Y',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AAS Shell 정보
CREATE TABLE IF NOT EXISTS aas_shell (
    seq_id          BIGSERIAL PRIMARY KEY,
    aasx_file_id    BIGINT NOT NULL REFERENCES aasx_file(seq_id) ON DELETE CASCADE,
    shell_id_short  VARCHAR(255),
    global_asset_id VARCHAR(500),
    asset_kind      VARCHAR(50) DEFAULT 'Instance',
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AAS 서브모델
CREATE TABLE IF NOT EXISTS aas_submodel (
    seq_id          BIGSERIAL PRIMARY KEY,
    shell_id        BIGINT NOT NULL REFERENCES aas_shell(seq_id) ON DELETE CASCADE,
    id_short        VARCHAR(255),
    semantic_id     VARCHAR(500),
    element_count   INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AAS SubmodelElement (Property 등)
CREATE TABLE IF NOT EXISTS aas_element (
    seq_id          BIGSERIAL PRIMARY KEY,
    submodel_id     BIGINT NOT NULL REFERENCES aas_submodel(seq_id) ON DELETE CASCADE,
    element_type    VARCHAR(50) DEFAULT 'Property',
    element_path    VARCHAR(500),
    id_short        VARCHAR(255),
    value_type      VARCHAR(50),
    value           TEXT,
    unit            VARCHAR(50),
    min_value       VARCHAR(50),
    max_value       VARCHAR(50),
    description_ko  TEXT,
    description_en  TEXT,
    semantic_id     VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_aas_shell_file ON aas_shell (aasx_file_id);
CREATE INDEX IF NOT EXISTS idx_aas_submodel_shell ON aas_submodel (shell_id);
CREATE INDEX IF NOT EXISTS idx_aas_element_submodel ON aas_element (submodel_id);
