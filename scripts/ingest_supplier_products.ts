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
import { supplierStagingCandidate } from '../lib/suppliers/staging';

const queries = process.argv.slice(2);
if (!queries.length) {
  console.log('No queries provided. Defaulting to: "phone stand"');
  queries.push('phone stand');
}


async function main() {
  const staged: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const { products, errors } = await searchAllSuppliers(q, { page: 1, limit: 20 });
    for (const e of errors) console.warn(`! ${e.supplier}: ${e.message}`);
    for (const p of products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      // A global shipping environment value is not an exact variant/destination
      // quote. Staging never turns cost-only evidence into a retail price.
      staged.push(supplierStagingCandidate(p, q));
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
