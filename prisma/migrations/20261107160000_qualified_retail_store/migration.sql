CREATE UNIQUE INDEX IF NOT EXISTS retail_variant_product_identity ON "ProductVariant"("productId",id);
-- Additive domain tables. No catalog conversion, live quotes, provider calls or activation.
CREATE TABLE "RetailQuote" (
 "snapshotId" text PRIMARY KEY, "lineKey" text NOT NULL, snapshot jsonb NOT NULL,
 "productId" uuid NOT NULL REFERENCES "Product"(id) ON DELETE RESTRICT,
 "variantId" uuid NOT NULL REFERENCES "ProductVariant"(id) ON DELETE RESTRICT,
 UNIQUE("lineKey","snapshotId"), UNIQUE("lineKey","snapshotId",snapshot),
 FOREIGN KEY("productId","variantId") REFERENCES "ProductVariant"("productId",id) ON DELETE RESTRICT,
 CHECK(snapshot->>'productId'="productId"::text AND snapshot->>'variantId'="variantId"::text)
);
CREATE TABLE "RetailOffer" (
 "lineKey" text PRIMARY KEY,"snapshotId" text NOT NULL,snapshot jsonb NOT NULL,
 "productId" uuid NOT NULL REFERENCES "Product"(id) ON DELETE RESTRICT,
 "variantId" uuid NOT NULL REFERENCES "ProductVariant"(id) ON DELETE RESTRICT,
 "availableQty" integer NOT NULL CHECK("availableQty">=0),published boolean NOT NULL DEFAULT false,
 FOREIGN KEY("lineKey","snapshotId",snapshot) REFERENCES "RetailQuote"("lineKey","snapshotId",snapshot),
 CHECK(snapshot->>'productId'="productId"::text AND snapshot->>'variantId'="variantId"::text)
);
CREATE TABLE "RetailCart" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"userId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 "createdAt" timestamp NOT NULL DEFAULT now(),lines jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(lines)='array'),
 "destinationCountry" text NOT NULL,"destinationPostal" text NOT NULL,
 UNIQUE("userId","destinationCountry","destinationPostal")
);
CREATE TABLE "RetailCheckout" (
 "orderId" uuid PRIMARY KEY REFERENCES "Order"(id) ON DELETE RESTRICT,
 version integer NOT NULL CHECK(version=2),lines jsonb NOT NULL,"amountCents" bigint NOT NULL CHECK("amountCents">0),
 "destinationCountry" text NOT NULL,"destinationPostal" text NOT NULL,
 "providerOrderId" text NOT NULL,state text NOT NULL CHECK(state IN('CREATED','SIMULATED_PAID')),
 "captureId" text,"displayLines" jsonb NOT NULL
);
CREATE TABLE "RetailOrderLine" (
 "orderId" uuid NOT NULL REFERENCES "Order"(id) ON DELETE RESTRICT,
 "lineKey" text NOT NULL,"snapshotId" text NOT NULL,snapshot jsonb NOT NULL,qty integer NOT NULL CHECK(qty>0),
 PRIMARY KEY("orderId","lineKey"), UNIQUE("orderId","lineKey","snapshotId",qty),
 FOREIGN KEY("lineKey","snapshotId",snapshot) REFERENCES "RetailQuote"("lineKey","snapshotId",snapshot)
);
CREATE TABLE "RetailAllocation" (
 "orderId" uuid NOT NULL,"lineKey" text NOT NULL,"snapshotId" text NOT NULL,qty integer NOT NULL CHECK(qty>0),
 state text NOT NULL CHECK(state IN('HELD','CONSUMED')),
 PRIMARY KEY("orderId","lineKey"), UNIQUE("orderId","lineKey","snapshotId",qty),
 FOREIGN KEY("orderId","lineKey","snapshotId",qty) REFERENCES "RetailOrderLine"("orderId","lineKey","snapshotId",qty) ON DELETE RESTRICT
);
-- Quote versions are immutable. Refresh inserts a new quote and moves the offer pointer.
CREATE FUNCTION retail_quote_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Retail quote versions are immutable'; END $$;
CREATE TRIGGER retail_quote_immutable BEFORE UPDATE OR DELETE ON "RetailQuote" FOR EACH ROW EXECUTE FUNCTION retail_quote_immutable();
-- Do not inherit anonymous API access from provider default privileges.
DO $$ DECLARE t text; target text; BEGIN
 FOREACH t IN ARRAY ARRAY['RetailQuote','RetailOffer','RetailCart','RetailCheckout','RetailOrderLine','RetailAllocation'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  FOREACH target IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=target) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,target);END IF;
  END LOOP;
 END LOOP;
END $$;
-- Runtime grants/policies are intentionally not activated here. Before enabling
-- the default-OFF feature, qualify the actual non-owner login and its policies.
-- Quote writing/publication belongs to a separate reviewed ingestion identity.
