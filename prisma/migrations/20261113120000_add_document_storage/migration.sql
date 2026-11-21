-- AlterTable
ALTER TABLE "document" ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "document_storageKey_key" ON "document"("storageKey");
