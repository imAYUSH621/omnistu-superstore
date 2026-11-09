-- Correct inherited hosted default grants only on newly introduced commercial tables.
-- Never change existing core-table rights, role membership, LOGIN, ownership,
-- default privileges or feature flags. Independent review evidence stays read-only.
DO $$ DECLARE t text;r text;col text;BEGIN
 FOREACH t IN ARRAY ARRAY['RetailQuote','RetailOffer','RetailCart','OrderSupplierPlan','OrderSupplierAllocation','OrderSupplierAttempt','ReviewedCheckoutTerms'] LOOP
  FOREACH r IN ARRAY ARRAY['PUBLIC','anon','authenticated','omnistu_app'] LOOP
   IF r='PUBLIC' THEN EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
   ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
    EXECUTE format('REVOKE ALL ON %I FROM %I',t,r);
    FOR col IN SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=t LOOP
     EXECUTE format('REVOKE SELECT (%I),INSERT (%I),UPDATE (%I),REFERENCES (%I) ON %I FROM %I',col,col,col,col,t,r);
    END LOOP;
   END IF;
  END LOOP;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN
  GRANT SELECT ON "RetailQuote","RetailOffer","RetailCart","OrderSupplierPlan","OrderSupplierAllocation","OrderSupplierAttempt","ReviewedCheckoutTerms" TO omnistu_app;
  GRANT INSERT,UPDATE,DELETE ON "RetailCart" TO omnistu_app;
  GRANT UPDATE ("availableQty") ON "RetailOffer" TO omnistu_app;
  GRANT INSERT ON "OrderSupplierPlan","OrderSupplierAllocation","OrderSupplierAttempt" TO omnistu_app;
  GRANT UPDATE (state) ON "OrderSupplierAllocation" TO omnistu_app;
  GRANT UPDATE (state,"supplierOrderId") ON "OrderSupplierAttempt" TO omnistu_app;
 END IF;
END $$;
