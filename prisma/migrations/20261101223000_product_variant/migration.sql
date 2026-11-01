-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "referenceCost" DECIMAL(12,2),
    "supplierStock" INTEGER,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "product_variant_product_idx" ON "ProductVariant"("productId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
