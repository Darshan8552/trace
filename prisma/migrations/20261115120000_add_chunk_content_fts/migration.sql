-- CreateIndex
CREATE INDEX "chunk_content_fts_idx" ON "chunk" USING GIN (to_tsvector('simple', "content"));
