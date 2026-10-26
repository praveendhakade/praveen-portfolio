ALTER TABLE knowledge_chunks
  ADD COLUMN IF NOT EXISTS last_ingested_at timestamptz NOT NULL DEFAULT now();

DROP INDEX IF EXISTS knowledge_chunks_embedding_cosine_idx;

CREATE INDEX knowledge_chunks_embedding_cosine_idx
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
