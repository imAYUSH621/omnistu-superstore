-- (ReturnRequest.updatedAt precision change moved to 20261101095700_return_request_rma:
-- it ran before that table existed, so a fresh database failed to migrate.)

-- CreateTable
CREATE TABLE "FulfillmentTask" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "supplier" TEXT NOT NULL,
    "payload" JSON NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfillmentTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FulfillmentTask_status_nextAttemptAt_idx" ON "FulfillmentTask"("status", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "FulfillmentTask" ADD CONSTRAINT "FulfillmentTask_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
