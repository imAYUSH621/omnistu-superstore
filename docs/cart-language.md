# Existing cart language followthrough

The normal cart and qualified test-cart/review components use the six existing language preferences. Original product names and variant labels stay unchanged. Monetary arithmetic, stored amounts and USD settlement are unchanged. Stored prices say USD explicitly, without pretending display conversion is payment settlement. Public qualified checkout remains OFF.

Quantity controls have localized accessible names. The existing decrement action is labeled remove one, not delete-all. The gift checkbox was not persisted or passed to order handling and has been removed rather than offering a false gift service. Empty cart links to the catalog, not an unverified deals promise. Demo recommendations remain sample-mode gated. Failed cart reads show unavailable rather than empty. Stale qualified carts have no navigable continue link.

Local actual-component tests cover all six languages, empty/populated ordinary cart, current/stale qualified review, stored amount/name preservation and cart-page errors/metadata. Browser fixtures mock action/router boundaries and are not hosted order proof. Candidate/public and existing isolated signed-in acceptance must be reported separately. No real payment, supplier order, dispatch or email is authorized by this change.
