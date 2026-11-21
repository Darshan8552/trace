-- CreateTable
CREATE TABLE "rate_limit_bucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "blob_deletion" (
    "storageKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blob_deletion_pkey" PRIMARY KEY ("storageKey")
);

-- CreateIndex
CREATE INDEX "rate_limit_bucket_resetAt_idx" ON "rate_limit_bucket"("resetAt");

-- CreateIndex
CREATE INDEX "blob_deletion_createdAt_idx" ON "blob_deletion"("createdAt");
