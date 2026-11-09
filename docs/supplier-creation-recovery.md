# Existing unpaid supplier order recovery

A mode2 first sale can lose the createOrderV2 response after CJ creates the unpaid order. The attempt's durable UNKNOWN/REQUESTED marker must block automatic resubmission, but it also needs a read-only route to recover the already-existing identity. This change adds that route to the real admin order page, independently default OFF with `CJ_CREATION_RECOVERY_ENABLED`.

The admin supplies only the local order UUID. The server reloads the historical immutable paid non-simulated plan, exact consumed allocations and uncertain supplier attempt. It authenticates and calls getOrderDetail with the **persisted local order UUID as custom order ID**, never a caller-selected CJ identifier. It does not create an order, confirm a cart, generate a parent, pay, cancel, substitute, refund, dispatch or retry.

The response must have a non-empty CJ orderId, exact historical destination including postal, correct products/quantities/store line IDs, origin/method/warehouse, USD shape and isSandbox=0. In addition every product line's documented `orderNumber` must equal the local order UUID. `orderNum` is CJ's order name and is never used as the merchant echo. Missing postal or null/merged/wrong merchant echoes fail closed, as do progressed/paid/cancelled states. Only CREATED/IN_CART/UNPAID with no payment evidence may be recovered.

After the network reads, binding is rechecked under the order lock. The attempt transitions from UNKNOWN/REQUESTED with NULL supplier ID to ACCEPTED exactly once, and the existing append-only lifecycle observation is inserted atomically. A concurrent lookup that already recorded the same identity returns the stored result, without another write. A repeat after acceptance performs no supplier query. Conflicting identity, missing results, auth failure, HTTP failure or concurrent order change does not clear UNKNOWN and never authorizes resubmission. No new schema or order plan rewrite is introduced. The existing create adapter now refuses redirects and contradictory success/error codes as well.

This source path is still unproven against a real provider order. The public detail schema does not guarantee postal read availability, so recovery may correctly remain blocked. Funding quote/payId/amount/expiry/duplicate guarantees are independent missing contracts and are not resolved by recovering an unpaid creation. Actual supplier payment remains unimplemented. No callback registration is needed for this first-sale path.

## Sources
- https://developers.cjdropshipping.com/en/api/api2/api/shopping.html section1.7: getOrderDetail accepts Custom order id or CJ order id. Product line orderNumber is Store order number, can differ per line on merged CJ orders, and can be null when not filled. isSandbox0/1 defined. Exact detail response omits shippingZip, so no guaranteed availability is claimed.
- https://developers.cjdropshipping.com/en/api/api2/standard/field.html: generic Shipping.shippingZip is not a getOrderDetail inclusion guarantee.
- https://developers.cjdropshipping.com/en/api/start/Orders-Synchronization-Processing.html: mode2 CJ logistics does not need own-label upload; mode1 labels are not a prerequisite for this path.

## Qualification

Local synthetic evidence only, not live provider proof:25 new unit/UI/action tests and4 new connected PostgreSQL cases cover exact merchant/line/postal identity, progressed-state refusal, OFF/role/invalid ID, uncertain-response no resubmit, concurrent one-time recovery, repeated accepted identity no-read, unchanged funding UNKNOWN, concurrent address refusal, and no money/shipment claim.37 affected existing order locale/simulation cases pass. TypeScript/lint pass. The actual UI is separately inspected with synthetic UNKNOWN/OFF/ACCEPTED states. No provider calls, points, supplier/account mutation, payments, customer sends or activation occurred. All gates remain OFF; enabling reads requires separately grounded scope.
