-- Read-only external query evidence. Does not modify payment/order/funding state.
CREATE TABLE "SupplierPaymentObservation" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "orderId" uuid NOT NULL REFERENCES "Order"(id),
 "planDigest" text NOT NULL,
 "supplierOrderId" text NOT NULL,
 "observedAt" timestamptz NOT NULL DEFAULT now(),
 "responseDigest" text NOT NULL,
 evidence jsonb NOT NULL CHECK ((evidence->>'reviewOnly'='true' AND evidence->>'retryAllowed'='false') IS TRUE)
);
CREATE INDEX ON "SupplierPaymentObservation" ("orderId","observedAt");
REVOKE ALL ON "SupplierPaymentObservation" FROM PUBLIC;
DO $$DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','omnistu_app'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON "SupplierPaymentObservation" FROM %I',r);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN GRANT SELECT,INSERT ON "SupplierPaymentObservation" TO omnistu_app;END IF;
END$$;
CREATE FUNCTION reject_supplier_payment_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Supplier payment observations are append-only';END$$;
CREATE TRIGGER supplier_payment_append_only BEFORE UPDATE OR DELETE ON "SupplierPaymentObservation" FOR EACH ROW EXECUTE FUNCTION reject_supplier_payment_rewrite();
REVOKE ALL ON FUNCTION reject_supplier_payment_rewrite() FROM PUBLIC;
