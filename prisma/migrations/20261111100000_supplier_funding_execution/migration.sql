-- Default-OFF supplier funding execution journal. Records at most one claimed
-- payment execution per order: the exact approved amount, the exact paired
-- shipmentOrderId/payId from one saveGenerateParentOrder response, and the
-- outcome. Vendor contract (support thread, 2026-11-11): payBalanceV2 has no
-- amount parameter and debits the amount generated for that payId; repeating
-- the same payId never charges twice; expiry is resolved by regenerating a new
-- payId for the same order; paid/unpaid truth comes from getOrderDetail only.
CREATE TABLE "SupplierFundingExecution" (
 "orderId" uuid PRIMARY KEY REFERENCES "Order"(id),
 "planDigest" text NOT NULL,
 "supplierOrderId" text NOT NULL,
 "shipmentOrderId" text NOT NULL,
 "payId" text NOT NULL,
 "approvedAmountUsd" text NOT NULL,
 "approvedBy" text NOT NULL,
 "quoteDigest" text NOT NULL,
 state text NOT NULL CHECK (state IN ('PAY_REQUESTED','PAY_UNKNOWN','RETRY_REQUESTED','PAID','HOLD_REVIEW')),
 attempts smallint NOT NULL CHECK (attempts BETWEEN 1 AND 2),
 regenerated boolean NOT NULL DEFAULT false,
 "retryShipmentOrderId" text,
 "retryPayId" text,
 "retryQuoteDigest" text,
 "payResponseDigest" text,
 "confirmationDigest" text,
 "holdReason" text,
 "expirySignalled" boolean NOT NULL DEFAULT false,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON "SupplierFundingExecution" FROM PUBLIC;
DO $$DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','omnistu_app'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON "SupplierFundingExecution" FROM %I',r);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN GRANT SELECT,INSERT,UPDATE ON "SupplierFundingExecution" TO omnistu_app;END IF;
END$$;
CREATE FUNCTION guard_supplier_funding_execution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'PAY_REQUESTED' OR NEW.attempts<>1 OR NEW.regenerated OR NEW."retryShipmentOrderId" IS NOT NULL OR NEW."retryPayId" IS NOT NULL OR NEW."retryQuoteDigest" IS NOT NULL OR NEW."payResponseDigest" IS NOT NULL OR NEW."confirmationDigest" IS NOT NULL OR NEW."holdReason" IS NOT NULL OR NEW."expirySignalled" THEN RAISE EXCEPTION 'Supplier funding execution must start as one claimed pay request, never an approval or a result';END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Supplier funding execution evidence cannot be erased';END IF;
 IF NEW."orderId" IS DISTINCT FROM OLD."orderId" OR NEW."planDigest" IS DISTINCT FROM OLD."planDigest" OR NEW."supplierOrderId" IS DISTINCT FROM OLD."supplierOrderId" OR NEW."shipmentOrderId" IS DISTINCT FROM OLD."shipmentOrderId" OR NEW."payId" IS DISTINCT FROM OLD."payId" OR NEW."approvedAmountUsd" IS DISTINCT FROM OLD."approvedAmountUsd" OR NEW."approvedBy" IS DISTINCT FROM OLD."approvedBy" OR NEW."quoteDigest" IS DISTINCT FROM OLD."quoteDigest" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN RAISE EXCEPTION 'Supplier funding approval and payment pair binding is immutable';END IF;
 IF NOT (OLD.state='PAY_UNKNOWN' AND NEW.state='RETRY_REQUESTED') AND (NEW."retryShipmentOrderId" IS DISTINCT FROM OLD."retryShipmentOrderId" OR NEW."retryPayId" IS DISTINCT FROM OLD."retryPayId" OR NEW."retryQuoteDigest" IS DISTINCT FROM OLD."retryQuoteDigest" OR NEW.regenerated IS DISTINCT FROM OLD.regenerated) THEN RAISE EXCEPTION 'Supplier funding retry pair is immutable once recorded';END IF;
 IF OLD.state=NEW.state THEN RAISE EXCEPTION 'Supplier funding execution updates must change state';END IF;
 IF NOT ((OLD.state='PAY_REQUESTED' AND NEW.state IN ('PAY_UNKNOWN','PAID','HOLD_REVIEW')) OR (OLD.state='PAY_UNKNOWN' AND NEW.state IN ('PAID','HOLD_REVIEW','RETRY_REQUESTED')) OR (OLD.state='RETRY_REQUESTED' AND NEW.state IN ('PAY_UNKNOWN','PAID','HOLD_REVIEW'))) THEN RAISE EXCEPTION 'Supplier funding state transition requires authoritative evidence';END IF;
 IF NEW.attempts IS DISTINCT FROM OLD.attempts AND NOT (OLD.state='PAY_UNKNOWN' AND NEW.state='RETRY_REQUESTED' AND OLD.attempts=1 AND NEW.attempts=2) THEN RAISE EXCEPTION 'Supplier funding allows at most one retry after confirmed-unpaid';END IF;
 IF OLD.state='PAY_UNKNOWN' AND NEW.state='RETRY_REQUESTED' THEN
  IF NEW.regenerated AND (NEW."retryPayId" IS NULL OR NEW."retryQuoteDigest" IS NULL OR NEW."retryShipmentOrderId" IS DISTINCT FROM OLD."shipmentOrderId" OR NEW."retryPayId"=OLD."payId") THEN RAISE EXCEPTION 'A regenerated supplier payment requires a new distinct payId bound to the same parent shipment';END IF;
  IF NOT NEW.regenerated AND (NEW."retryPayId" IS NOT NULL OR NEW."retryQuoteDigest" IS NOT NULL OR NEW."retryShipmentOrderId" IS NOT NULL) THEN RAISE EXCEPTION 'A same-payId retry must reuse the recorded pair exactly';END IF;
 END IF;
 IF NEW.state='PAID' AND NEW."confirmationDigest" IS NULL THEN RAISE EXCEPTION 'Paid supplier funding requires provider confirmation evidence';END IF;
 IF NEW.state='HOLD_REVIEW' AND (NEW."holdReason" IS NULL OR length(NEW."holdReason")<1) THEN RAISE EXCEPTION 'Held supplier funding requires a recorded reason';END IF;
 IF NEW."expirySignalled" IS DISTINCT FROM OLD."expirySignalled" AND NEW.state<>'PAY_UNKNOWN' THEN RAISE EXCEPTION 'Expiry signal belongs to an unconfirmed pay outcome';END IF;
 NEW."updatedAt":=now();
 RETURN NEW;
END$$;
CREATE TRIGGER supplier_funding_execution_guard BEFORE INSERT OR UPDATE OR DELETE ON "SupplierFundingExecution" FOR EACH ROW EXECUTE FUNCTION guard_supplier_funding_execution();
REVOKE ALL ON FUNCTION guard_supplier_funding_execution() FROM PUBLIC;
