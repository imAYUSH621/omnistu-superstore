# Supplier payment record review

This is a separately default-OFF **read-only external account** integration in the real admin order page. It does not implement supplier payment execution. `CJ_PAYMENT_RECONCILIATION_ENABLED` must remain unset/false unless the owner explicitly authorizes the scoped provider reads and any points they consume. Authentication plus exact order detail plus one billingHistory page are the only allowed remote requests. No wallet subscription is set up.

## Binding and outcomes

Only an authenticated admin can submit the local order UUID. The server reloads the paid non-simulated immutable supplier plan, accepted supplier order ID and exact consumed allocations. Historical snapshots validate identity, not fresh spending. It validates provider address except postal, products, origin/method/warehouse, USD shape and sandbox exclusion through the shared order-identity validator. Payment-record review does NOT claim postal or shipment/delivery proof. The lifecycle assessor still requires independent postal, chronology and carrier evidence for shipment/delivery.

The billingHistory request is POST with `pageNum:1,pageSize:100,orderId:<persisted accepted CJ ID>,tradeTypeList:[1]`. There is no account-wide query, customer identity parameter, caller-supplied CJ reference, automatic pagination or fallback to a guessed parent reference. The response must match the same exact CJ reference, record type, valid UTC dates, unique record IDs, non-negative exact USD values and documented status0-4. An absent/changed reference, malformed response, provider error or concurrent binding change refuses persistence. API error1610001 is not treated as no payment.

The accepted create-order ID may not be the CJ parent/child number used by billing. This unresolved mapping is deliberately visible: an empty result never means unpaid or safe-to-retry. A success record or quote-amount match does not prove a particular payId. More than100 records or a partial first page is explicitly incomplete. Statuses failed/frozen/canceled do not permit a new charge. The result always has `reviewOnly:true,retryAllowed:false,paymentAuthorization:false,paymentIdVerified:false`.

After the reads, the order, plan, accepted attempt, allocation and saved quote are rechecked under the order lock. Only a normalized append-only observation with timestamp/response digest is written. No Order, SupplierFundingPreparation, allocation, payment, shipment or delivery state is changed. Raw account fields, balances, messages, unrelated records and shipping PII are not copied into the observation. Saved observations show their check time and remain separate from live authorization. The funding UNKNOWN journal remains unchanged.

## Money contracts still unresolved

The normal payBalanceV2 request has shipmentOrderId and optional payId only, not an expected-amount parameter. The docs do not establish an immutable payId-to-exact-USD-total/parent-membership binding, expiry timezone, duplicate semantics or exact payId outcome query. A default-OFF executor must not fabricate those contracts. This read integration is useful recovery evidence, not a replacement for them and not a claim that funding or whole-store earning-readiness is complete.

## Sources checked9 Nov2026

- https://developers.cjdropshipping.com/en/api/api2/api/shopping.html - sections1.9,2.3,2.4, and parent creation examples.
- https://developers.cjdropshipping.com/zh/api/api2/api/shopping.html - cross-language contract check; missing expiry/member definitions remain unresolved.
- https://developers.cjdropshipping.com/en/api/api2/api/shopping_new.html - alternative/private order APIs do not define normal dropshipping guarantees.
- https://developers.cjdropshipping.com/en/api/api2/api/webhook.html - sections6.2-6.5 distinguish wallet record references, message dedupe and unordered changes. No receiver/subscription is implemented by this change.
- https://developers.cjdropshipping.com/en/api/api2/standard/field.html - generic shippingZip is not an endpoint guarantee.
- https://developers.cjdropshipping.com/en/api/start/Orders-Synchronization-Processing.html - mode2 needs no own waybill upload; modes1/3 need a real post-payment label path, which remains separate unfinished work.

## Qualification

42 new tests including7 connected disposable-PostgreSQL cases, plus6 affected lifecycle tests. TypeScript/lint pass. Fresh local database migration deployment succeeds. Actual component rendered and inspected at390px for OFF/EMPTY/SUCCESS/INCOMPLETE using local synthetic responses; no live supplier or payment proof is implied. No provider calls, points, payment, supplier/account mutation or customer sends were used. New schema is additive, no legacy row/ACL changes, runtime SELECT/INSERT only, database UPDATE/DELETE trigger guard and required review-only flags. Hosted migration requires backup/clone/privilege qualification before release.
