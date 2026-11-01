# Payment / order hardening tracker (1 Nov 2026)
Status words: DONE-LOCAL = merged + tested locally (unit and/or disposable Postgres), NOT deployed, NOT production-qualified.

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
5. No oversell guard: stock can go negative (refusing after capture strands money; business decision).
6. orders sync still writes with SERVICE_ROLE||ANON; no server-only restricted credential exists.
7. No real-provider PayPal/Stripe E2E; no crash-recovery test for downstream effects.

## Owner decisions
- Wire the outbox row into updateOrderToPaid? Needs: FulfillmentTask table confirmed present in the production DB (migration 20261101055500 applied?), because a missing table would make the paid transaction fail. Passive recording only; no runner.
- Scheduler/runner, supplier idempotency keys, oversell policy.
- ECOM SQL stages (10 add function; 20 close anon SELECT; 30 close anon INSERT gated on restricted write path), authenticated role, rotation, hosting tier, preview deploy.

## SQL candidate caveats (local only, not applied)
Advisory-lock attempt limit proven under 40 parallel sessions; per-order lockout by anyone who knows an id; attempt-table growth until 15-min purge; knowledge-only auth; SECURITY DEFINER = privilege containment only; rollbacks re-open broad access by design (emergency only).
