CREATE INDEX IF NOT EXISTS "chunk_embedding_idx"
  ON "chunk" USING hnsw ("embedding" vector_cosine_ops);
