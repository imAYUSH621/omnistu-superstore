-- AlterTable
ALTER TABLE "ServiceEnquiry" ADD COLUMN "userId" UUID;

-- CreateIndex
CREATE INDEX "ServiceEnquiry_userId_idx" ON "ServiceEnquiry"("userId");

-- AddForeignKey
ALTER TABLE "ServiceEnquiry" ADD CONSTRAINT "ServiceEnquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
