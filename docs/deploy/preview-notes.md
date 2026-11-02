# Deployed preview notes (2026-11-02)

- Preview alias: https://omnistu-superstore-preview-pro-9de6.vercel.app (re-pointed to the latest READY preview deployment after each deploy; current: omnistu-superstore-cxuo09nee-pro-9de6.vercel.app, main @ 56e2f82).
- Vercel Authentication (ssoProtection=preview) gates every preview URL; E2E uses a registered Protection Bypass for Automation secret (project settings).
- DATABASE_URL must use the Supabase TRANSACTION pooler (port 6543) with `pgbouncer=true&connection_limit=1`: the session pooler (5432, pool_size 15) exhausts under serverless concurrency and failed sign-up with EMAXCONNSESSION.
- NEXTAUTH_URL / NEXT_PUBLIC_SERVER_URL have preview-scoped values pointing at the preview alias; production values unchanged.
- Legacy SUPABASE_URL / SUPABASE_ANON_KEY (pointing at the old ECOM project) are stripped from the preview target so no Store preview code path can read/write ECOM.
- Orders off: ORDERS_ENABLED unset; all payment methods report "Not available yet"; createOrder fails closed server-side.
- All 18 imported products are cjstg- supplier-staging rows, hidden from public queries in production (lib/test-fixture.ts); the storefront falls back to the labeled sample catalog.
