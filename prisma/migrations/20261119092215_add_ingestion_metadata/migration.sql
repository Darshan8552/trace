-- AlterTable
ALTER TABLE "document" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "sourceCheckedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "document_userId_chatId_contentHash_idx" ON "document"("userId", "chatId", "contentHash");
