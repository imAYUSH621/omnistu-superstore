# CJ-managed ordinary logistics source qualification

This draft follows the controlled OFF release278. It is not merged, deployed, enabled or a live provider qualification. No migrations or hosted writes. All existing warehouse-bound v1 identity/hash behavior stays unchanged.

Official current CJ order-process guidance explicitly distinguishes two paths, including Create OrderV2 used by this store:
https://developers.cjdropshipping.com/en/api/start/Orders-Synchronization-Processing.html#_1-platform-waybill-orders-processing
https://developers.cjdropshipping.com/en/api/api2/api/shopping.html
https://developers.cjdropshipping.com/en/api/api2/api/logistic.html

Mode1/3 is platform-waybill fulfillment: separate supplier payment, then a seller-supplied shipping label before warehouse processing. Mode2 is CJ logistics: no storageId, exact named logisticName; after separate payment CJ arranges shipment. The retained ordinary quotes used mode2, so they cannot approve an exact mode1 warehouse shipment or imply a label exists.

New snapshotv2 explicitly records CJ-managed origin rather than fabricating a warehouse: provider/product/variant, approved origin country, destination/postal, named method, current exact quote/amount/quantity and independent sourcing evidence. A separate strict evidence object requires supplier availability-confirmation, stock, freight and fulfillment-terms references, confirmed quantity, handling-day bound and its own freshness window. The quote cannot outlive that evidence. Missing/blank/stale evidence or any warehouseId is refused. These are trusted review references, not customer assertions or proof that CJ accepted a particular order; web runtime cannot write those quote/offer records. No automatic ingestion or approval writer is added.

New defaultOFF flag CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED controls the shared payment/dispatch projection. With it off a v2order cannot proceed to payment or submission. With explicit local fixture enablement it projects mode2, exactCJvariantIDs/method/origin/destination, payType3 and no storageId. Existing v1mode2 cannot be silently reinterpreted; mixed source modes/shipments still require explicit review. Supplier payment/confirmation/tracking remain separate unimplemented/unauthorized execution stages. No purchase, funding or shipment is claimed.

An actual disposable-DB test runs the customer selected-item/cart/full reviewedfees/place-order/idempotency/mockedPayPal path with two v2options. It proves no warehouse in payload and defaultOFF refusal before payment. Missing evidence/fakewarehouse/staleconfirmation/excessconfirmedquantity tests fail closed. Existing exactwarehouse and oldorder compatibility tests retained. Local227suites/1979tests/zero skips,19focusedDBcases plus3managed-source tests;typecheck/lint pass. Jest force-exits, not open-handle-clean. CleanCI pending at draft publication.

Remaining account boundary: retained factory counts and Nov8quotes do not meet this model. Current exact supplier availability/sourcing/handling and a matching mode2route/terms record need permitted account verification. Actual provider order acceptance/payment/shipping/tracking remain separate future evidence. CJ point question unanswered; no account calls. Merchant account market/receiving fees, customer price/terms, commercially eligible host and explicit activation are also still required.0/18products remain commercially qualified.
