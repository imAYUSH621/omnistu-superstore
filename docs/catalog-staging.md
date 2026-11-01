# Supplier catalog staging (CJ), read-only

`scripts/stage-cj-products.mjs` reads CJ Dropshipping (token call, product list, product detail, stock by product) and writes a review file. It never writes to a database, orders anything, or fetches shipping quotes. Key comes from the vault (`CJ_API_KEY` env, never printed or committed).

What CJ provides per item (verified on the 2026-11-01 run, 18 items across the 6 categories): English name, supplier category, description text, images, per-variant SKU and cost, suggested sell price, and per-warehouse stock (CN, US, ES, GB seen) via `getInventoryByPid`.

What it does not provide or we do not know:
- Brand: none (only the supplier name, kept separate). `Product.brand` is optional; unknown stays null and the label is hidden.
- Stock is supplier warehouse stock at fetch time, not a reservation. It can be stale. Which warehouse ships to the buyer is not decided.
- Image licensing is unverified.
- Retail price is NOT computed: shipping, tax and payment fees are unverified. `lib/pricing.ts` is indicative only and its defaults (2.9% + 0.30 fee, 30% margin) are configuration assumptions, not verified provider rates.

Nothing in the staging file is published. Items need owner qualification (merchandising, price, warehouse and shipping choice) before any import. The 22 legacy OMN ids have no CJ pid mapping and are not enriched.
