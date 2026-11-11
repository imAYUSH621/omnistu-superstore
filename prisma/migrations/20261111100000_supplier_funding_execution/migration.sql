-- Default-OFF supplier funding execution journals. SupplierFundingApproval is
-- the only wallet-spend authority: an append-only record that binds one exact
-- reviewed quote (order, plan, supplier order, parent shipment, exact amount)
-- to an external owner-approval evidence reference. The journal is externally
-- verified authorization storage: its only writer is the operator-controlled
-- script path, never an HTTP route, server action or admin UI, so no web
-- caller can self-mint authority. An admin click or a typed amount is never
-- spend authority. The split is database-enforced: the app runtime role holds
-- SELECT,UPDATE (consume) only, while INSERT belongs solely to the separate
-- omnistu_funding_operator role. SupplierFundingExecution records at most one
-- claimed payment execution per order and consumes exactly one approval.
-- Vendor contract (support reply 2026-11-11): payBalanceV2 takes no amount and
-- debits what saveGenerateParentOrder generated for that payId; repeating the
-- same payId never charges twice; paid/unpaid truth is getOrderDetail status
-- only. Pair-mismatch behavior is vendor-unconfirmed: the pair is never split
-- or recombined. The reply documents no expiry error code, so none is
-- detected: an expired or rejected payment resolves as a confirmed-unpaid
-- HOLD, never as an automatic regeneration.
CREATE TABLE "SupplierFundingApproval" (
 "orderId" uuid NOT NULL REFERENCES "Order"(id),
 "planDigest" text NOT NULL,
 "supplierOrderId" text NOT NULL,
 "shipmentOrderId" text NOT NULL,
 "quoteDigest" text NOT NULL,
 "approvedAmountUsd" text NOT NULL,
 "evidenceRef" text NOT NULL,
 "recordedBy" text NOT NULL,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 "consumedAt" timestamptz,
 PRIMARY KEY ("orderId","quoteDigest","evidenceRef")
);
REVOKE ALL ON "SupplierFundingApproval" FROM PUBLIC;
DO $$DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','omnistu_app'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON "SupplierFundingApproval" FROM %I',r);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN GRANT SELECT,UPDATE ON "SupplierFundingApproval" TO omnistu_app;END IF;
 -- Privilege split: the app runtime role (omnistu_app) can read and consume
 -- approvals but can NEVER insert one, so no app code path, admin session or
 -- SQL-injection write through the runtime role can self-mint spend
 -- authority. The only INSERT-capable role is omnistu_funding_operator, a
 -- separate NOLOGIN role used solely by the operator-controlled writer
 -- (scripts/record-supplier-funding-approval.ts) with production database
 -- access outside the app. Read-only SELECT covers the writer's binding
 -- re-derivation (preparation, plan, attempt, allocation, lifecycle reads).
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_funding_operator') THEN CREATE ROLE omnistu_funding_operator NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;
 -- Least exact binding reads only (no broad schema SELECT): exactly the
 -- tables the writer's binding re-derivation reads. UPDATE on "Order" and
 -- "OrderSupplierAllocation" is lock-only: the shared derivation takes FOR
 -- UPDATE row locks through them; this role runs no write statement.
 -- The role is granted to NO other role, so the app runtime role cannot
 -- reach it by SET ROLE or inheritance.
 REVOKE ALL ON "SupplierFundingApproval" FROM omnistu_funding_operator;
 GRANT SELECT,INSERT ON "SupplierFundingApproval" TO omnistu_funding_operator;
 GRANT SELECT ON "OrderSupplierPlan","OrderItem","OrderSupplierAttempt","SupplierLifecycleObservation","SupplierFundingPreparation" TO omnistu_funding_operator;
 GRANT SELECT,UPDATE ON "Order" TO omnistu_funding_operator;
 GRANT SELECT,UPDATE ON "OrderSupplierAllocation" TO omnistu_funding_operator;
END$$;
CREATE FUNCTION guard_supplier_funding_approval() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW."consumedAt" IS NOT NULL THEN RAISE EXCEPTION 'A supplier funding approval starts unconsumed';END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Supplier funding approval evidence cannot be erased';END IF;
 IF NEW."orderId" IS DISTINCT FROM OLD."orderId" OR NEW."planDigest" IS DISTINCT FROM OLD."planDigest" OR NEW."supplierOrderId" IS DISTINCT FROM OLD."supplierOrderId" OR NEW."shipmentOrderId" IS DISTINCT FROM OLD."shipmentOrderId" OR NEW."quoteDigest" IS DISTINCT FROM OLD."quoteDigest" OR NEW."approvedAmountUsd" IS DISTINCT FROM OLD."approvedAmountUsd" OR NEW."evidenceRef" IS DISTINCT FROM OLD."evidenceRef" OR NEW."recordedBy" IS DISTINCT FROM OLD."recordedBy" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN RAISE EXCEPTION 'Supplier funding approval binding is immutable';END IF;
 IF OLD."consumedAt" IS NOT NULL OR NEW."consumedAt" IS NULL THEN RAISE EXCEPTION 'A supplier funding approval is consumed exactly once, forever';END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER supplier_funding_approval_guard BEFORE INSERT OR UPDATE OR DELETE ON "SupplierFundingApproval" FOR EACH ROW EXECUTE FUNCTION guard_supplier_funding_approval();
REVOKE ALL ON FUNCTION guard_supplier_funding_approval() FROM PUBLIC;
CREATE TABLE "SupplierFundingExecution" (
 "orderId" uuid PRIMARY KEY REFERENCES "Order"(id),
 "planDigest" text NOT NULL,
 "supplierOrderId" text NOT NULL,
 "shipmentOrderId" text NOT NULL,
 "payId" text NOT NULL,
 "approvedAmountUsd" text NOT NULL,
 "approvalEvidenceRef" text NOT NULL,
 "approvedBy" text NOT NULL,
 "quoteDigest" text NOT NULL,
 state text NOT NULL CHECK (state IN ('PAY_REQUESTED','PAY_UNKNOWN','RETRY_REQUESTED','PAID','HOLD_REVIEW')),
 attempts smallint NOT NULL CHECK (attempts BETWEEN 1 AND 2),
 "payResponseDigest" text,
 "confirmationDigest" text,
 "holdReason" text,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON "SupplierFundingExecution" FROM PUBLIC;
DO $$DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','omnistu_app'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON "SupplierFundingExecution" FROM %I',r);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN GRANT SELECT,INSERT,UPDATE ON "SupplierFundingExecution" TO omnistu_app;END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_funding_operator') THEN GRANT SELECT ON "SupplierFundingExecution" TO omnistu_funding_operator;END IF;
END$$;
CREATE FUNCTION guard_supplier_funding_execution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'PAY_REQUESTED' OR NEW.attempts<>1 OR NEW."payResponseDigest" IS NOT NULL OR NEW."confirmationDigest" IS NOT NULL OR NEW."holdReason" IS NOT NULL THEN RAISE EXCEPTION 'Supplier funding execution must start as one claimed pay request, never an approval or a result';END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Supplier funding execution evidence cannot be erased';END IF;
 IF NEW."orderId" IS DISTINCT FROM OLD."orderId" OR NEW."planDigest" IS DISTINCT FROM OLD."planDigest" OR NEW."supplierOrderId" IS DISTINCT FROM OLD."supplierOrderId" OR NEW."shipmentOrderId" IS DISTINCT FROM OLD."shipmentOrderId" OR NEW."payId" IS DISTINCT FROM OLD."payId" OR NEW."approvedAmountUsd" IS DISTINCT FROM OLD."approvedAmountUsd" OR NEW."approvalEvidenceRef" IS DISTINCT FROM OLD."approvalEvidenceRef" OR NEW."approvedBy" IS DISTINCT FROM OLD."approvedBy" OR NEW."quoteDigest" IS DISTINCT FROM OLD."quoteDigest" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN RAISE EXCEPTION 'Supplier funding approval and payment pair binding is immutable';END IF;
 IF NEW.attempts IS DISTINCT FROM OLD.attempts AND NOT (OLD.state='PAY_UNKNOWN' AND NEW.state='RETRY_REQUESTED' AND OLD.attempts=1 AND NEW.attempts=2) THEN RAISE EXCEPTION 'Supplier funding allows at most one retry after a confirmed-unpaid read';END IF;
 IF OLD.state=NEW.state THEN RAISE EXCEPTION 'Supplier funding execution updates must change state';END IF;
 IF NOT ((OLD.state='PAY_REQUESTED' AND NEW.state IN ('PAY_UNKNOWN','PAID','HOLD_REVIEW')) OR (OLD.state='PAY_UNKNOWN' AND NEW.state IN ('PAID','HOLD_REVIEW','RETRY_REQUESTED')) OR (OLD.state='RETRY_REQUESTED' AND NEW.state IN ('PAY_UNKNOWN','PAID','HOLD_REVIEW'))) THEN RAISE EXCEPTION 'Supplier funding state transition requires authoritative evidence';END IF;
 IF NEW.state='PAID' AND NEW."confirmationDigest" IS NULL THEN RAISE EXCEPTION 'Paid supplier funding requires provider confirmation evidence';END IF;
 IF NEW.state='HOLD_REVIEW' AND (NEW."holdReason" IS NULL OR length(NEW."holdReason")<1) THEN RAISE EXCEPTION 'Held supplier funding requires a recorded reason';END IF;
 NEW."updatedAt":=now();
 RETURN NEW;
END$$;
CREATE TRIGGER supplier_funding_execution_guard BEFORE INSERT OR UPDATE OR DELETE ON "SupplierFundingExecution" FOR EACH ROW EXECUTE FUNCTION guard_supplier_funding_execution();
REVOKE ALL ON FUNCTION guard_supplier_funding_execution() FROM PUBLIC;
