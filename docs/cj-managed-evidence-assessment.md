# Offline CJ managed-origin evidence assessment

This source-only tool supports the default-OFF mode2 model in PR279. It is not called by checkout, and has no network, database, offer publication or approval writer.

`assessCJManagedEvidence` accepts a candidate snapshot and operator-supplied independently reviewed record extractions. Each availability, stock, freight and terms reference must resolve once. It checks the retained-body digest, exact product/variant/origin/destination/postal/method, quantity, supplier/freight amounts, handling maximum and expiry. Freight quantity must match the quoted quantity exactly. A candidate cannot extend source expiry. Missing, duplicate, mismatched or stale records require review.

A complete synthetic packet only returns `readyForIndependentReview`. Every result has `commercialApproval:false`. A SHA256 digest proves byte consistency, not provider authorship or truth. These extracted fields must be checked against original retained provider records by a trusted reviewer before the packet is used. The function cannot authenticate that reviewer and must not be exposed to customer input as an approval endpoint. A generated reference, invented record or self-certified extraction supplies no evidence.

Current retained drafts for items10,11,16 remain ineligible: no independent exact-option availability confirmation, no handling maximum, no current valid freight/terms and no adopted retail amount or customer obligations. Old factory counts and ordinary routes cannot fill these gaps. No current stock, reservation, provider acceptance, payment or shipment is claimed.

Local qualification:228 suites,1983 tests,zero skips including the existing19 disposable-DB cases; four new offline assessment tests cover exact binding, tampering, missing/duplicate records and expiry. Typecheck/lint pass. Jest uses forceExit, so this is not an open-handle-clean claim. No new migration, hosted write, provider call or production activation.
