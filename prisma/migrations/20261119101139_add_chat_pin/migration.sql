-- AlterTable
ALTER TABLE "chat" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "chat_userId_isPinned_updatedAt_idx" ON "chat"("userId", "isPinned", "updatedAt");
