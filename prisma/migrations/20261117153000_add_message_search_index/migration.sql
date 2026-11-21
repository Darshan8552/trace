-- CreateIndex
CREATE INDEX "chat_message_content_fts_idx" ON "chat_message" USING GIN (to_tsvector('simple', "content"));
