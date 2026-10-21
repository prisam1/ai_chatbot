-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "shareId" TEXT;

-- CreateTable
CREATE TABLE "GenerationUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationUsage_userId_createdAt_idx" ON "GenerationUsage"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_shareId_key" ON "ChatMessage"("shareId");

-- AddForeignKey
ALTER TABLE "GenerationUsage" ADD CONSTRAINT "GenerationUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

