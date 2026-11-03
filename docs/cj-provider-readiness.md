# CJ provider readiness, 4 November 2026

## Current official contract, no account API calls in this check

- Access token and refresh token default to 180 days. Authentication QPS is 1. The Get Token and Refresh Token endpoints return the same cached tokens within 24h; an auth refresh is not a rate-limit or suspension remedy.
- Conservative free/sales level 0-1 rate is 1 request/second. Higher levels have different limits. Current account level and remaining quota are not checked.
- Daily call-count limits have been replaced by points. Base allocation: 50,000/day, UTC midnight reset. Order conversion adds points; replenishment occurs per minute. These are usage-quota credits; the docs do not establish a cash purchase price.
- Product list costs 50 points. Product detail and inventory-by-product each cost 10. A 6-keyword, 18-item staging pass would use up to 660 points if each keyword yields three distinct products (6*50 + 18*10 + 18*10), excluding retries/other requests. This is a planned budget, not authorization or a measured account charge.
- Quota exhaustion can be HTTP429 with pointsInfo; code 1600200 is rate limit, 1600201 quota, 16900500 insufficient points, and 1600014 account suspension. Do not treat all HTTP429 as a 1.5-second retry.
- Zero transaction amount for 30 days can suspend API access. Website reactivation is a separate account action, not key rotation; no reactivation done here.

## Code changes

The staging transport paces all sequential calls including authentication at >=1.1 seconds. It stops the run on rate/quota/suspension/auth/network/unreadable/server errors, with bounded reason codes and no automatic retry or token refresh. It accepts a caller-managed CJ_ACCESS_TOKEN for token reuse, without writing a token cache; it does not itself cache persistent secrets. No live supplier call, order, stock refresh, freight request, activation or point consumption was made during verification. Other legacy supplier adapters have separate behavior and are not claimed fixed by this patch.

A tracked `.cache/cj/auth.json` containing nonempty access/refresh-token fields was found and removed from the current source tree. Ignore rules and a regression prevent that artifact entering future source/deploy uploads. Values were not printed. Removal does not erase history, revoke tokens or clean older deployments. Separate owner-authorized incident containment remains needed; no credential rotation/logout performed.

## Retained catalog evidence

A local backup taken 3 November 2026 18:04:48 UTC contains 18 cjstg routing fixtures and 210 variant rows. Every variant has a SKU, reference cost and supplierStock field, but nine variant names are empty. No source variant ID, warehouse country or stock-fetch timestamp is present in those retained variant rows. All 18 products use category placeholder art, not factual SKU photos. Brands remain null. The snapshot is historical, not fresh inventory evidence.

Names/descriptions suggest clusters: earbuds (Tech); rings/watch straps (Jewelry); diffuser/lamp, shelves and kitchen storage (Home); hoodies/sweatshirts (Apparel); puzzles/baby soothing toy (Toys). These are text-only leads, not semantic/image/rights qualification. Three home-storage fixtures still carry Gourmet placeholder art, although category text is Home. One apparel name says "For Pets" while its description says women's sweatshirt; unresolved contradiction. No food SKU is evidenced by this 18-item snapshot. No item is qualified to publish.

## Sources read

- https://developers.cjdropshipping.com/en/api/start/limit.html
- https://developers.cjdropshipping.com/en/api/api2/api/auth.html
- https://developers.cjdropshipping.com/en/api/api2/standard/points.html
- https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html
