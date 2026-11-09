-- Preserve every historical row and its values. Legacy row identity is its old
-- product-based primary key, never an inferred variant or supplier mapping.
ALTER TABLE "OrderItem" ADD COLUMN "lineKey" text;
UPDATE "OrderItem" SET "lineKey"='legacy:'||"productId"::text;
ALTER TABLE "OrderItem" ALTER COLUMN "lineKey" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "OrderItem" ALTER COLUMN "lineKey" SET NOT NULL;
ALTER TABLE "OrderItem" ADD CONSTRAINT order_item_line_key_nonempty CHECK(length("lineKey") BETWEEN 1 AND 200);
ALTER TABLE "OrderItem" DROP CONSTRAINT "orderitems_orderId_productId_pk";
ALTER TABLE "OrderItem" ADD CONSTRAINT "orderitems_orderId_lineKey_pk" PRIMARY KEY("orderId","lineKey");
