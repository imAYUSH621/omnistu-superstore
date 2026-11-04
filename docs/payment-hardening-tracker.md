# Payment / order hardening tracker (1 Nov 2026)
Status words: DONE-LOCAL = merged + tested locally (unit and/or disposable Postgres), NOT deployed, NOT production-qualified.

## 4 Nov 2026: current bounded release ledger

Older entries below are historical snapshots, not the current deployment checklist.

| Item | Code/test result | Release status | Remaining limit |
| --- | --- | --- | --- |
| Separate-order stock contention | PR203: atomic stock>=qty decrement inside paid transaction; stable product lock order; typed STOCK_UNAVAILABLE; real+simulated paths. Baseline double-winner reproduced. Full disposable Postgres suite717pass/3skip, including true DB-trigger failure and captured-unsettled preservation. | LIVE merge `4d0d89819574d940b190881307334807c087ae44`, deployment `dpl_Do88LUYGecEvFoXcLiGDKpZMifCo` READY; public home/health/search200, catalog empty. | Does not reserve before provider capture. Different orders can still be charged before one loses allocation; manual reconciliation, no refund/retry chosen. |
| Capture/create entry and crash-held attempts | PR204: server method/master-switch/paid/bound-ID/environment/review guards, durable pre-call CAS, one-winner create/capture, retained review markers, no automatic expiry or retry. Full disposable Postgres733pass/3skip, ordinary663pass/71envskip before final two tests; tsc and changed-file eslint clean. | Prepared and tested, NOT LIVE. Final head/merge CI and deployment qualification pending. | Ambiguous attempts deliberately stay closed for manual review, even when a crash may have happened before the request was sent. No automatic retry/refund. |
| Post-paid side effects | Existing read-only reconciliation can find paid orders without complete dispatch after grace period. Passive outbox helper has local commit/abort tests. | No new wiring or worker enabled. | Fire-and-forget mail/receipt/mirror/dispatch can still be lost after commit. No claim of crash-safe delivery. |
| Retail activation | No changes made. | OFF; catalog empty. | Current stock/rights/cost/shipping/tax/provider qualification still required. |

Local disposable-DB results do not prove hosted DB behavior or real-provider end-to-end payment.
No production DB migration, provider calls, real charges, email sends, supplier orders, automatic refunds or retries were part of PR203/204 qualification.

## Done (PRs #62-#67 line)
- DONE-LOCAL admin/owner authz on paid/deliver/PayPal create+approve; chat lookup exact match + no service-role fallback (#62, #63)
- DONE-LOCAL PayPal: USD capture, COMPLETED capture with amount required (fail-closed), PayPal order id bound to stored id (#63, #65)
- DONE-LOCAL Stripe: two-decimal minor units, orderId metadata required, USD only (#63)
- DONE-LOCAL atomic paid transition (compare-and-set inside stock tx), exact-cent amount check, mismatch write cannot overwrite a paid order; 7+ real-PG tests, 3 fail on pre-fix code (#66)
- DONE-LOCAL chat lookup: RPC-first with PGRST202-only fallback; UUID ids lowercased (#64-#66)
- DONE-LOCAL read-only admin reconciliation of paid orders with missing/incomplete dispatch record (/admin/reconciliation, getPaidOrderReconciliation): no supplier calls, no writes (#67)
- PREPARED, NOT WIRED: enqueueFulfillmentTask accepts an optional tx so an outbox row can be written in the paid transaction; real-PG tests show commit-together, abort-together, dedupe

## Open gaps (not fixed)
1. Post-commit effects (email, receipt, Supabase mirror, supplier dispatch) are fire-and-forget; no outbox row in the paid tx; crash/freeze after commit loses them silently. Visible only via the reconciliation page.
2. Supplier unknown outcome: dispatcher sends no idempotency key. A paid order with null/failed dispatch may already be accepted by a supplier. NEVER retry blindly.
3. G7 queue (FulfillmentTask) is autonomy-OFF and unwired; no scheduler. Enabling a runner = autonomy + supplier-spend decision (owner).
4. Supabase mirror is plain POST (re-sync fails on unique order_id; no self-heal).
5. Updated by PR203 above: local stock cannot be allocated below zero through settlement. Pre-capture reservation is still absent, so a completed charge can require manual review after allocation fails.
6. orders sync still writes with SERVICE_ROLE||ANON; no server-only restricted credential exists.
7. No real-provider PayPal/Stripe E2E; no crash-recovery test for downstream effects.

## Owner decisions
- Wire the outbox row into updateOrderToPaid? Needs: FulfillmentTask table confirmed present in the production DB (migration 20261101055500 applied?), because a missing table would make the paid transaction fail. Passive recording only; no runner.
- Scheduler/runner, supplier idempotency keys, oversell policy.
- ECOM SQL stages (10 add function; 20 close anon SELECT; 30 close anon INSERT gated on restricted write path), authenticated role, rotation, hosting tier, preview deploy.

## SQL candidate caveats (local only, not applied)
Advisory-lock attempt limit proven under 40 parallel sessions; per-order lockout by anyone who knows an id; attempt-table growth until 15-min purge; knowledge-only auth; SECURITY DEFINER = privilege containment only; rollbacks re-open broad access by design (emergency only).

## 1 Nov 2026 (late): database readiness and Products/Services header
- /api/health now classifies the DB (ok / not_configured / down / schema_incomplete); verified locally on real Postgres (5 scenarios). Production status is "no DATABASE_URL configured" (see docs/database-setup.md). Local-tested; live-unverified.
- Header: Products | Services switch (sliding pill) + /services holding page (empty catalog, no invented offerings, noindex while empty). Category naming replaces "Department" in the search picker, drawer, sidebar and i18n. Scaffold: the real service list is not supplied.
- (20:15) Brand wordmark corrected from ".us" to ".com" (header, footer; omnistu.com is the confirmed brand domain). /services now lists 7 service lines drawn from the owner's own description of what Omnistu sells (no prices, counts or claims) with detail pages /services/[slug]; owner review of wording pending. docs/db/supabase-lockdown.sql added and verified locally (anon/authenticated lose access, owner unaffected).

## Service enquiries (local, candidate - not production-qualified)
- `ServiceEnquiry` table (migration 20261101200000), `POST /api/enquiries` (validation, honeypot, best-effort per-instance rate limit; saves to DB, returns 503 if no DB configured, never claims email), form on /services/[slug], read-only /admin/enquiries (admin guard). Fresh migrate deploy of 10 migrations + zero drift verified on a local Postgres; 2-row populated admin view and form flow checked locally. No email notification, no deploy, no hosted DB.
- Account link (local candidate): migration 20261101203000 adds nullable `ServiceEnquiry.userId` (FK ON DELETE SET NULL). Set only from the live same-origin session at submit time; guests stay guests; no linking by email, no backfill of historical rows; client-supplied userId ignored. `/user/enquiries` shows own rows only (guest redirected to sign-in); `/admin/enquiries` denies non-admins. Same-origin only: cross-subdomain SSO is not built or proven. Fresh (11 migrations) and applied-history (10 then +1) local paths: zero drift.
- Catalog import safety (local candidate): additive `scripts/import-catalog.ts` (dry-run default, create-only, optional descriptive-field update, never deletes, never touches stock/price/rating); destructive `db/seed.ts` now refuses non-local DBs and production; read-only oversold list on /admin/reconciliation; "Amazon Choice" badge strings removed from catalog_unified.json (unrendered data). Stock policy (refund/backorder/reserve) is NOT chosen - owner decision.
- Chat grounding + sign-up email (local candidate): the assistant's product search now reads the same source as the store pages (DB first, demo sample only without DB), so links open real product pages and prices match; it no longer searches or quotes ratings/review counts/badges (unverified), and the system prompt forbids best-seller/top-rated/popular claims. Previously chat linked /product/<OMN-id> (no such page) and quoted catalog_unified prices (one differed from the store). Sign-up now lowercases/trims email; sign-in lookup is case-insensitive (mixed-case sign-up could never sign in before). Verified locally: mixed-case sign-in works, wrong password stays on /sign-in.
