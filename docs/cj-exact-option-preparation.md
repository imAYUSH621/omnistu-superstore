# Exact-option catalog preparation

This is preparation, not retail activation. Nothing here creates a Product,
ProductVariant, RetailOffer, order, payment or supplier dispatch.

The historical `import-cj-test-catalog.mjs` entry is retired. It exits before
loading Prisma or contacting a supplier. It previously accepted an arbitrary
database URL, set a demo markup and truncated options. Do not reuse it.

Two paths share `prepareCjOptions`:

- Existing read-only `stage-cj-products.mjs` includes an `optionPreparation`
  result for every exact supplier variant. It never invents buyer labels from
  raw SKU or source option strings. Its inventory observation time is the
  completed inventory read, not the beginning of the whole batch.
- `node scripts/prepare-cj-options.mjs retained-input.json output.json` reads
  retained source data only. It needs no key, network or database. The output
  must be a new file. Input and output may not be the same path.

Input is `{products:[{detail,inventory,detailObservedAt,inventoryObservedAt,
reviews:[]}]}`. `detail` and `inventory` are the original CJ response `data`
objects, not whole response envelopes. Dates must come from the original
retrieval record, not file mtime or the time this command runs. A review has
`pid`, `vid`, `buyerLabel`, `sourceRef` and `observedAt`. It attaches only to
that exact product and option. A source reference is not commercial approval.

All options are retained, including unknown-cost or missing-stock options.
Duplicate product/variant/inventory/country/review identities and duplicate
supplier SKUs stop instead of silently overwriting. Unknown quantities and
costs stay null. Factory inventory is never warehouse-ready stock. Positive
warehouse fields are only snapshots and never reservations. The supplier's
fulfillment listing type remains separate from these fields.

Every result is HOLD with no retail price. Missing buyer review, cost, image,
stock and stale/future source evidence are reported independently. Required
merchant costs, exact destination freight, image use review, retail approval
and publication review remain explicit. This output is not an accepted input
for the qualified retail writer or queue and cannot create an offer. The
existing `prepareQualifiedCatalogRow` gate remains unchanged.

Image reuse across width options does not prove dimensions. A photo does not
verify material, skin safety, adhesion, stock, carrier eligibility or handling
SLA. Supplier reference costs are not customer prices.

Qualification covers full-option retention, factory/warehouse separation,
null evidence, source dates, identity conflicts, explicit human labels,
retired importer refusal and offline CLI overwrite protection. Live supplier
availability and commercial terms need their own current evidence.
