-- Existing trusted server identity only. Never create a login or enable a feature.
-- Core Order/User/Product grants remain unchanged. Quote ingestion/publication is
-- intentionally NOT granted to the web runtime. Safe to reapply for role checks.
DO $$
DECLARE t text;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app') THEN
  FOREACH t IN ARRAY ARRAY['RetailQuote','RetailOffer','RetailCart','OrderSupplierPlan','OrderSupplierAllocation','OrderSupplierAttempt'] LOOP
   EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
   IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname=current_schema() AND tablename=t AND policyname='supplier_backend_runtime') THEN
    EXECUTE format('CREATE POLICY supplier_backend_runtime ON %I FOR ALL TO omnistu_app USING (true) WITH CHECK (true)',t);
   END IF;
  END LOOP;
  GRANT SELECT ON "RetailQuote","RetailOffer","RetailCart","OrderSupplierPlan","OrderSupplierAllocation","OrderSupplierAttempt" TO omnistu_app;
  GRANT INSERT,UPDATE,DELETE ON "RetailCart" TO omnistu_app;
  GRANT UPDATE ("availableQty") ON "RetailOffer" TO omnistu_app;
  GRANT INSERT ON "OrderSupplierPlan","OrderSupplierAllocation","OrderSupplierAttempt" TO omnistu_app;
  GRANT UPDATE (state) ON "OrderSupplierAllocation" TO omnistu_app;
  GRANT UPDATE (state,"supplierOrderId") ON "OrderSupplierAttempt" TO omnistu_app;
 END IF;
END $$;
