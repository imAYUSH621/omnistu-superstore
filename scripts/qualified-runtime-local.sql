-- ONLY disposable localhost database omnistu_test_qualified_release.
CREATE ROLE qualified_test_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO qualified_test_runtime;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qualified_test_runtime;
GRANT INSERT,UPDATE,DELETE ON "User","Cart","Order","OrderItem","VerificationToken","UserSessionVersion","AuthAttempt","RetailCart","RetailCheckout","RetailOrderLine","RetailAllocation" TO qualified_test_runtime;
GRANT UPDATE("availableQty") ON "RetailOffer" TO qualified_test_runtime;
CREATE POLICY qualified_test_runtime_all ON "RetailCart" FOR ALL TO qualified_test_runtime USING(true) WITH CHECK(true);
CREATE POLICY qualified_test_runtime_all ON "RetailCheckout" FOR ALL TO qualified_test_runtime USING(true) WITH CHECK(true);
CREATE POLICY qualified_test_runtime_all ON "RetailOrderLine" FOR ALL TO qualified_test_runtime USING(true) WITH CHECK(true);
CREATE POLICY qualified_test_runtime_all ON "RetailAllocation" FOR ALL TO qualified_test_runtime USING(true) WITH CHECK(true);
CREATE POLICY qualified_test_runtime_read ON "RetailQuote" FOR SELECT TO qualified_test_runtime USING(true);
CREATE POLICY qualified_test_runtime_read ON "RetailOffer" FOR SELECT TO qualified_test_runtime USING(true);
CREATE POLICY qualified_test_runtime_qty ON "RetailOffer" FOR UPDATE TO qualified_test_runtime USING(true) WITH CHECK(true);
CREATE POLICY qualified_test_runtime_all ON "UserSessionVersion" FOR ALL TO qualified_test_runtime USING(true) WITH CHECK(true);
CREATE POLICY qualified_test_runtime_all ON "AuthAttempt" FOR ALL TO qualified_test_runtime USING(true) WITH CHECK(true);
