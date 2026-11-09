# Exact supplier comparison preparation

This is offline catalog work. It does not create retail offers or publish,
charge, order, email or dispatch anything. Supplier API points are not needed.

The retained-source command uses the existing CJ cached-offer, freight,
explicit mapping and selection modules as one preparation path:

```
npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/prepare-supplier-offers.ts input.json new-output.json
```

Input supplies `items`, `freight`, `mappings`, `targetVariantKey`, `context`
and `maxAgeMs`. The command supplies the current comparison time, not new
source times. Context requires exact origin country, destination country and
postal code, quantity, USD currency and named shipping method. Items use the
existing `CjStagingItem` shape. Source timestamps remain the original reads.
No credential or database is loaded. Existing files are never overwritten.

## Boundaries

- The caller chooses one exact variant identity. Without that choice, mixed
  variant keys cannot compete by price. Different colors, widths or plugs
  cannot become the cheapest replacement for what the buyer selected.
- A provider variant cannot belong to two canonical identities. Ambiguous
  mappings refuse; input order never decides. Canonical labels cannot absorb
  an unrelated unmapped provider identity. Mapping records remain inputs to
  review, not proof of owner authority or permission to publish.
- Supplier total inventory stays separately labeled. Comparable stock needs
  an explicit origin and its verified warehouse quantity. Factory totals,
  missing fields and other-country stock do not become ready stock. Supplier
  snapshots are never reservations or dispatch promises.
- Freight is matched before canonical mapping, against the original provider
  identity, origin, destination, quantity and named method. Unmatched freight
  is cleared, not inherited from a previous context. Unknown, malformed or
  negative costs are not comparable. Stale quotes are excluded.
- Quantity is used for both stock sufficiency and supplier item subtotal.
  Integer/finite money values and safe bounds are checked. The result is a
  supplier item plus freight comparison, never full landed cost or retail.

Every preparation result is HOLD with `writes:false` and `publish:false`,
including a fully comparable supplier quote. Merchant handling, tax/duty,
payment fees, returns reserve, retail approval and commercial activation
remain outside this command. Production listing, queue and checkout gates
are unchanged. Generic comparison fixtures are not provider qualification.

## Verification

Tests cover explicit identity and ambiguous mapping, factory/warehouse
separation, origin/method/destination/quantity isolation, stale or malformed
source evidence, quantity arithmetic and the non-writing preparation path.
Retained-source qualification must be reported separately from mocks and
from any current provider reads. A report generated now does not refresh its
historical prices, stock or freight evidence.
