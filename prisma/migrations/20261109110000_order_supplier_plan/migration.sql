-- Additive only. Existing orders receive no inferred supplier mappings.
CREATE TABLE "OrderSupplierPlan" (
 "orderId" uuid PRIMARY KEY REFERENCES "Order"(id) ON DELETE RESTRICT,
 digest text NOT NULL CHECK(digest ~ '^[a-f0-9]{64}$'),
 plan jsonb NOT NULL CHECK(jsonb_typeof(plan)='object' AND plan->>'version'='1' AND plan->>'orderId'="orderId"::text),
 "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE FUNCTION order_supplier_plan_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Order supplier plans are immutable; use an explicit reviewed recovery'; END $$;
CREATE TRIGGER order_supplier_plan_immutable BEFORE UPDATE OR DELETE ON "OrderSupplierPlan" FOR EACH ROW EXECUTE FUNCTION order_supplier_plan_immutable();
ALTER TABLE "OrderSupplierPlan" ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=target) THEN EXECUTE format('REVOKE ALL ON "OrderSupplierPlan" FROM %I',target); END IF;
 END LOOP;
END $$;
-- No customer runtime grants, provider calls, offer publication or activation here.
CREATE TABLE "OrderSupplierAllocation" (
 "orderId" uuid NOT NULL REFERENCES "OrderSupplierPlan"("orderId") ON DELETE RESTRICT,
 "lineKey" text NOT NULL REFERENCES "RetailOffer"("lineKey") ON DELETE RESTRICT,
 qty integer NOT NULL CHECK(qty>0),state text NOT NULL CHECK(state IN('HELD','CONSUMED','RELEASED')),
 PRIMARY KEY("orderId","lineKey")
);
ALTER TABLE "OrderSupplierAllocation" ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=target) THEN EXECUTE format('REVOKE ALL ON "OrderSupplierAllocation" FROM %I',target);END IF;
 END LOOP;
END $$;
CREATE TABLE "OrderSupplierAttempt" (
 "orderId" uuid PRIMARY KEY REFERENCES "OrderSupplierPlan"("orderId") ON DELETE RESTRICT,
 state text NOT NULL CHECK(state IN('REQUESTED','ACCEPTED','REJECTED','UNKNOWN')),
 "supplierOrderId" text,"createdAt" timestamp NOT NULL DEFAULT now()
);
ALTER TABLE "OrderSupplierAttempt" ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=target) THEN EXECUTE format('REVOKE ALL ON "OrderSupplierAttempt" FROM %I',target);END IF;
 END LOOP;
END $$;
