-- TCL: pgvector extension 활성화 + 이메일 임베딩 테이블 생성

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS email_embeddings (
    id          BIGSERIAL PRIMARY KEY,
    email_id    BIGINT,
    content     TEXT        NOT NULL,
    embedding   VECTOR(1536) NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW 인덱스: cosine 유사도 기반 근사 최근접 탐색 (OpenAI text-embedding-3-small)
CREATE INDEX IF NOT EXISTS email_embeddings_embedding_idx
    ON email_embeddings
    USING hnsw (embedding vector_cosine_ops);
