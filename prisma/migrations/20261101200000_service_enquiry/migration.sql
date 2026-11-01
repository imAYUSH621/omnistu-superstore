-- CreateTable
CREATE TABLE "ServiceEnquiry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "serviceSlug" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceEnquiry_status_createdAt_idx" ON "ServiceEnquiry"("status", "createdAt");
