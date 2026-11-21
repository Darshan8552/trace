-- AlterTable
ALTER TABLE "chat" ADD COLUMN     "shareSlug" TEXT,
ADD COLUMN     "shareCreatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "chat_shareSlug_key" ON "chat"("shareSlug");
