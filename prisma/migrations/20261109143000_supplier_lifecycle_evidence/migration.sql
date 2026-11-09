-- Append-only, server-read provider observations. No default-grant leakage.
-- No mutation of legacy orders, core privileges, owners, RLS or defaults.
CREATE TABLE "SupplierLifecycleObservation" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "orderId" uuid NOT NULL REFERENCES "Order"(id),
 "planDigest" text NOT NULL,
 "supplierOrderId" text NOT NULL,
 "observedAt" timestamptz NOT NULL DEFAULT now(),
 "responseDigest" text NOT NULL,
 evidence jsonb NOT NULL
);
CREATE INDEX ON "SupplierLifecycleObservation" ("orderId","observedAt");
REVOKE ALL ON "SupplierLifecycleObservation" FROM PUBLIC;
DO $$ DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','omnistu_app'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON "SupplierLifecycleObservation" FROM %I',r);
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN
  GRANT SELECT,INSERT ON "SupplierLifecycleObservation" TO omnistu_app;
 END IF;
END $$;
CREATE FUNCTION reject_supplier_lifecycle_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Supplier lifecycle observations are append-only'; END $$;
CREATE TRIGGER supplier_lifecycle_append_only BEFORE UPDATE OR DELETE ON "SupplierLifecycleObservation" FOR EACH ROW EXECUTE FUNCTION reject_supplier_lifecycle_rewrite();
REVOKE ALL ON FUNCTION reject_supplier_lifecycle_rewrite() FROM PUBLIC;
