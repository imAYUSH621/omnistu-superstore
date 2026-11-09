-- Independent commercial review evidence. No seed, approval, publication or enablement.
CREATE TABLE "ReviewedCheckoutTerms"(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"cartId" uuid NOT NULL REFERENCES "RetailCart"(id) ON DELETE RESTRICT,
 "userId" uuid NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,"reviewToken" text NOT NULL CHECK("reviewToken"~'^[a-f0-9]{64}$'),
 "cartToken" text NOT NULL CHECK("cartToken"~'^[a-f0-9]{64}$'),"itemsCents" bigint NOT NULL CHECK("itemsCents">0),
 "shippingCents" bigint NOT NULL CHECK("shippingCents">=0),"taxCents" bigint NOT NULL CHECK("taxCents">=0),
 "totalCents" bigint NOT NULL CHECK("totalCents"="itemsCents"+"shippingCents"+"taxCents"),
 "approvalSource" text NOT NULL CHECK(length(trim("approvalSource"))>0),"policySource" text NOT NULL CHECK(length(trim("policySource"))>0),
 "observedAt" timestamptz NOT NULL,"validUntil" timestamptz NOT NULL CHECK("validUntil">"observedAt"),
 UNIQUE("cartId","reviewToken",id)
);
CREATE TRIGGER reviewed_checkout_terms_immutable BEFORE UPDATE OR DELETE ON "ReviewedCheckoutTerms" FOR EACH ROW EXECUTE FUNCTION order_supplier_plan_immutable();
ALTER TABLE "ReviewedCheckoutTerms" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ReviewedCheckoutTerms" FROM PUBLIC;
DO $$ DECLARE r text;BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r)THEN EXECUTE format('REVOKE ALL ON "ReviewedCheckoutTerms" FROM %I',r);END IF;END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app')THEN
  GRANT SELECT ON "ReviewedCheckoutTerms" TO omnistu_app;
  CREATE POLICY reviewed_checkout_terms_read ON "ReviewedCheckoutTerms" FOR SELECT TO omnistu_app USING(true);
 END IF;
END $$;
