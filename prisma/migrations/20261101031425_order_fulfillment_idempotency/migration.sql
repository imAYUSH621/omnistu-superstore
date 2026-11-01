-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "paymentNote" TEXT,
ADD COLUMN     "dispatchStatus" TEXT,
ADD COLUMN     "dispatchSupplier" TEXT,
ADD COLUMN     "supplierOrderId" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingCarrier" TEXT,
ADD COLUMN     "dispatchedAt" TIMESTAMP(6),
ADD COLUMN     "dispatchError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
