-- Default-OFF supplier confirmation/final-quote journal. No approval or payment.
CREATE TABLE "SupplierFundingPreparation" (
 "orderId" uuid PRIMARY KEY REFERENCES "Order"(id),
 "planDigest" text NOT NULL,
 "supplierOrderId" text NOT NULL,
 state text NOT NULL CHECK (state IN ('CART_UNKNOWN','CONFIRM_UNKNOWN','PARENT_UNKNOWN','REVIEW_ONLY')),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 "detailDigest" text NOT NULL,
 "cartDigest" text,
 "shipmentOrderId" text,
 "confirmationDigest" text,
 "parentDigest" text,
 quote jsonb
);
REVOKE ALL ON "SupplierFundingPreparation" FROM PUBLIC;
DO $$DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','omnistu_app'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON "SupplierFundingPreparation" FROM %I',r);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN GRANT SELECT,INSERT,UPDATE ON "SupplierFundingPreparation" TO omnistu_app;END IF;
END$$;
CREATE FUNCTION guard_supplier_funding_preparation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state NOT IN ('CART_UNKNOWN','CONFIRM_UNKNOWN') OR NEW.quote IS NOT NULL OR NEW."shipmentOrderId" IS NOT NULL OR NEW."cartDigest" IS NOT NULL OR NEW."confirmationDigest" IS NOT NULL OR NEW."parentDigest" IS NOT NULL THEN RAISE EXCEPTION 'Supplier preparation must start with an uncertain checkpoint, never an approval';END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Supplier funding evidence cannot be erased';END IF;
 IF NEW."orderId" IS DISTINCT FROM OLD."orderId" OR NEW."planDigest" IS DISTINCT FROM OLD."planDigest" OR NEW."supplierOrderId" IS DISTINCT FROM OLD."supplierOrderId" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" OR NEW."detailDigest" IS DISTINCT FROM OLD."detailDigest" THEN RAISE EXCEPTION 'Supplier funding binding is immutable';END IF;
 IF NOT ((OLD.state='CART_UNKNOWN' AND NEW.state='CONFIRM_UNKNOWN') OR (OLD.state='CONFIRM_UNKNOWN' AND NEW.state='PARENT_UNKNOWN') OR (OLD.state='PARENT_UNKNOWN' AND NEW.state='REVIEW_ONLY')) THEN RAISE EXCEPTION 'Supplier funding state requires authoritative recovery; no retry';END IF;
 IF OLD."cartDigest" IS NOT NULL AND NEW."cartDigest" IS DISTINCT FROM OLD."cartDigest" THEN RAISE EXCEPTION 'Supplier cart evidence is immutable';END IF;
 IF OLD."shipmentOrderId" IS NOT NULL AND (NEW."shipmentOrderId" IS DISTINCT FROM OLD."shipmentOrderId" OR NEW."confirmationDigest" IS DISTINCT FROM OLD."confirmationDigest") THEN RAISE EXCEPTION 'Supplier confirmation evidence is immutable';END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER supplier_funding_guard BEFORE INSERT OR UPDATE OR DELETE ON "SupplierFundingPreparation" FOR EACH ROW EXECUTE FUNCTION guard_supplier_funding_preparation();
REVOKE ALL ON FUNCTION guard_supplier_funding_preparation() FROM PUBLIC;
