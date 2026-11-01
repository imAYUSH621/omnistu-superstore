# Catalog qualification and fixture cleanup

Status: design. Candidate, not production-qualified. Nothing here publishes a price or a product.

## Routing fixtures versus qualified catalog

- `fxt-` rows (test suites) and `cjstg-` rows (18 staged CJ items imported to the dev DB only) are **routing fixtures**. They exercise category routing, search, filters and the fixture guards. They say nothing about merchandising truth.
- The category of a staged item came from a keyword search. A keyword hit does not prove the item belongs in the category (example: kitchen shelves were filed under Gourmet). Treat the category as unverified.
- Fixtures are unsellable: server guards in `addItemToCart` and `createOrder`, no buy controls in the UI, placeholder-image label, cost shown as "reference only".

## Qualifying a real SKU (all must be true before it can be published)

1. Semantic category fit: a person reads the supplier name, description and images and confirms the item is what the store category promises (food in Gourmet, etc.). Record who checked and when. Keyword match alone never passes.
2. Product truth: name and description describe the item without invented claims, ratings, reviews, badges or brand. Brand stays blank if the supplier gives none.
3. Image rights: the supplier or a licence allows public use of the image, or the store uses its own photo. Until verified, no public supplier images.
4. Variant mapping: each sellable variant maps to one supplier variant id (SKU), and the store price is per variant.
5. Fulfilment source: warehouse country chosen per variant, with a fresh stock read. Supplier stock is not a reservation.
6. Landed cost: variant cost plus the freight quote for the chosen warehouse and destination, plus payment fee for the merchant account's real market, plus tax handling. Freight quotes need the real destination, not a sample ZIP.
7. Margin and shipping charge decided by the owner (flat rate, free threshold, absorbed freight).
8. Compliance: restricted goods and regulated categories (batteries, liquids, food, electronics) checked against the carrier line and destination.
9. Sample order and refund path run with a test provider, no real money.
10. Owner approval to publish. The publication hold stays until then.

## Fixture cleanup design (dev DB only)

- Scope: only rows with slug prefix `cjstg-` or `fxt-` in the dev project. Real data is never deleted. Production and ECOM are out of scope.
- Preconditions: (a) the backup File holds the staging JSON, freight quotes and the CSV tracker; (b) a count shows no order or cart row references a fixture product (the guards should make this zero); (c) the owner agrees the fixtures are no longer needed.
- Method: run a SELECT count first, then delete inside one transaction with the same predicate, compare counts, commit. No blanket delete, no TRUNCATE.
- After cleanup the DB catalog is empty until real qualified SKUs exist, and the app shows its honest empty state.
- A marker for demo identities should be a column or slug rule that code can test (`isTestFixtureSlug`), never a name match.
