# Whole dropshipping lifecycle correction, 9 November 2026

Earlier phase exhaustion covered checkout and default-OFF dispatch preparation only. It did not mean the whole purchase-to-delivery implementation was complete. Inspection found two real gaps: an admin could mark a paid order delivered without shipment evidence; the ten-minute quote validity guard would block legitimate days-later lifecycle reconciliation.

This increment changes the real admin delivery action to reconcile supplier evidence instead of setting a delivery timestamp itself. `CJ_LIFECYCLE_RECONCILIATION_ENABLED` is separately default OFF. A future enablement requires approved account-read scope and budget, suitable credential handling and deployed schema. No enablement, provider call or payment is part of this work.

The server adapter reads only CJ getOrderDetail and, when the provider says delivered, trackInfo. It matches the immutable bound order, address, exact line keys/variant/quantity, origin, method and warehouse where specified. Unknown supplier IDs, missing fields, sandbox responses, mismatched products, payment/status conflicts and ambiguous carrier responses require review. Payment is not delivery; creating an unpaid supplier order is not funding. A supplier shipment requires payment date, warehouse departure time, actual tracking number and carrier. Delivery requires both the exact provider order's DELIVERED state and the exact carrier track's Delivered status and valid delivery time. No arrival date is guessed.

Historical identity validation is limited to read-only lifecycle reconciliation. It verifies the original snapshot hashes, quantities, original plan/address/items/amounts and exact supplier binding without treating a days-old quote as fresh. Checkout and any new order/payment retain their existing freshness checks. New observations are appended with plan/response digests and source IDs, not used as customer-supplied authority. The table grants runtime SELECT/INSERT only and rejects UPDATE/DELETE. Original core rights/defaults and historical rows are not changed by the migration. Monotonic reconciliation prevents a late unpaid response overwriting shipped/delivered state. Bad/missing provider responses leave existing delivery state unchanged. Cancellation records require independent customer-payment/refund review; it does not refund or free paid stock automatically.

## Connected outcome and remaining work

- Buyer selection, exact cart, reviewed fees, customer payment, consumed allocation and unpaid supplier-order preparation reuse the existing Store path.
- Supplier submission is still payType3. The current official docs say it creates only: no add-to-cart, confirmation or funding. This code must never call it a paid/dispatched shipment.
- Supplier funding is not implemented or authorized by this increment. The documented sequence includes addCartConfirm, saveGenerateParentOrder and payBalanceV2. Confirmation can intercept changed product/warehouse/packaging; parent generation supplies a final payment ID and itemized total. A retail total or cached freight sum cannot substitute for that final payable quote. The deprecated cjPayUrl is not a valid new checkout path.
- Before funding can run, the actual final supplier total, payment ID, exact sub-order set, taxes/fees/packaging, expiry and cost to undo must be verified against owner-approved scope. An uncertain submit must never be automatically retried or replaced with a new order. No wallet funding executor is added here, and no user approval is invented from a code flag.
- This increment joins provider/carrier observation to Store shipment/delivery persistence and the existing tracking fields. It does not prove a real supplier accepted, funded, shipped or delivered an order.
- Unknown supplier creation outcomes still require authoritative identity recovery; no fallback supplier, automatic resubmission, split/merge, cancellation or money movement is introduced.
- Actual current stock/handling/route qualification, merchant receiving/KYC/fees, customer terms/prices and commercial hosting remain separate facts/decisions. They cannot be established by local fixtures.

## Qualification

Local229 suites/1990 tests/zero skips, including20 disposable-DB supplier cases and six new lifecycle validation cases, typecheck and lint pass. The real database test drives the server reconciliation adapter with synthetic mocked provider responses through unpaid, shipped and delivered, then checks wrong-variant and out-of-order refusal, append-only evidence and ACLs. No external account or API credit was used. Jest forceExit is used, so no open-handle-clean claim. Clean CI and preview/hosted migration are separate release steps, not implied by local success.

Sources read 9 November 2026:
- https://developers.cjdropshipping.com/en/api/api2/api/shopping.html (create-only payType3; Query Order fields/statuses; confirmation/payment sequence; deprecated cjPayUrl; sandbox semantics)
- https://developers.cjdropshipping.com/en/api/api2/api/logistic.html (exact trackInfo identity, status and deliveryTime)
- https://cjdropshipping.com/dispute-policy.html (cancellation/returns/dispute limitations; not adopted customer policy)

## Provider contract limitation

CJ's documented detail response calls orderNum an order name, not the submitted merchant orderNumber. Reconciliation binds only the exact CJ orderId persisted from the accepted supplier attempt; the name is not a guessed identity mapping. More importantly, the published response schema omits destination postal code. This implementation requires exact postal evidence before persisting SHIPPED or DELIVERED. Synthetic tests explicitly supply that extra field; they do not prove CJ returns it. A real documented provider field or separately approved authoritative destination evidence must be established before enabling. Until then, real shipment/delivery stays review-only/fail-closed rather than silently assuming the original destination did not change. Raw provider bodies are not retained: normalized evidence and a response digest are stored to avoid a new address/phone copy. This is integrity evidence, not a replayable full source archive.
