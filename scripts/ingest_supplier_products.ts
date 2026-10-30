/**
 * Pulls candidate products from supplier APIs into a STAGING file for human
 * review. It never writes to the live catalog without review.
 *
 *   npx ts-node scripts/ingest_supplier_products.ts "phone stand" "led lamp"
 *
 * Review data/staging_products.json, check specs/images/shipping to your
 * market, then move approved items into public/data/catalog_unified.json.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { searchAllSuppliers } from '../lib/suppliers/router';
import { priceFor } from '../lib/pricing';

const queries = process.argv.slice(2);
if (!queries.length) {
  console.log('No queries provided. Defaulting to: "phone stand"');
  queries.push('phone stand');
}

const usdToInr = Number(process.env.USD_TO_INR) || null;

async function main() {
  const staged: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const { products, errors } = await searchAllSuppliers(q, { page: 1, limit: 20 });
    for (const e of errors) console.warn(`! ${e.supplier}: ${e.message}`);
    for (const p of products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      const price = priceFor(p.wholesaleCost, 4);
      staged.push({
        ...p,
        retailPrice: p.supplier === 'PRINTIFY' ? p.retailPrice : price.retailPrice,
        estimatedMarginPct: price.marginPct,
        retailPriceInr: usdToInr ? Math.round(price.retailPrice * usdToInr) : null,
        sourceQuery: q,
        status: 'pending_review',
        reviewChecklist: ['specs verified', 'images licensed/usable', 'ships to target country', 'shipping cost confirmed'],
      });
    }
    console.log(`"${q}": ${products.length} results`);
  }

  await mkdir('data', { recursive: true });
  await writeFile('data/staging_products.json', JSON.stringify(staged, null, 2));
  console.log(`Wrote ${staged.length} products to data/staging_products.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
