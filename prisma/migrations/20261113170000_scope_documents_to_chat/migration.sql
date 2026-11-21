-- DropIndex
DROP INDEX "document_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "document" ADD COLUMN "chatId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "document_userId_chatId_createdAt_idx" ON "document"("userId", "chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
