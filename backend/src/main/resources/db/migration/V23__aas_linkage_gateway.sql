-- ============================================================
-- Phase 3: AAS 연계 + OPC-UA 게이트웨이 로그
-- ============================================================

-- AAS Linkage: OPC-UA DataPoint ↔ AAS Element 연결
CREATE TABLE IF NOT EXISTS aas_linkage (
    seq_id       BIGSERIAL PRIMARY KEY,
    node_id      VARCHAR(100) NOT NULL,
    element_id   BIGINT       NOT NULL,
    aas_path     VARCHAR(500),
    linked_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_aas_linkage_node UNIQUE (node_id),
    CONSTRAINT fk_linkage_node    FOREIGN KEY (node_id)    REFERENCES opcua_data_point(node_id) ON DELETE CASCADE,
    CONSTRAINT fk_linkage_element FOREIGN KEY (element_id) REFERENCES aas_element(seq_id)       ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aas_linkage_element ON aas_linkage (element_id);

-- OPC-UA Gateway Log
CREATE TABLE IF NOT EXISTS opcua_gateway_log (
    seq_id      BIGSERIAL PRIMARY KEY,
    log_level   VARCHAR(10)  NOT NULL,
    source      VARCHAR(100),
    message     TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gateway_log_time ON opcua_gateway_log (created_at DESC);
