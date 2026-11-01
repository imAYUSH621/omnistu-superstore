/**
 * Manual supplier sync REPORT. Runs the staging ingest for the standing
 * query set and writes data/staging_products.json for human review.
 *
 * It never writes to the live catalog and never marks staged items
 * purchasable. Without supplier API keys it prints a clear "not
 * configured" notice and exits 0 so a manual workflow run stays green.
 *
 *   npx ts-node scripts/sync_supplier_report.ts
 *
 * Scheduling boundary (2026-11-01 decision): this runs manually only
 * (workflow_dispatch). No cron/automation until the owner settles the
 * live supplier accounts, target environment and review flow.
 */
const QUERIES = ['saffron', 'spice box', 'fidget toy', 'wireless earbuds'];

async function main() {
  const hasAnyKey = Boolean(
    process.env.CJ_API_KEY ||
      process.env.FULFILLMENT_API_KEY ||
      process.env.BLANKA_API_KEY ||
      process.env.BRANDSGATEWAY_API_KEY ||
      process.env.PRINTIFY_API_TOKEN ||
      process.env.PRINTIFY_API
  );
  if (!hasAnyKey) {
    console.log(
      'Supplier sync NOT CONFIGURED: no supplier API keys present. ' +
        'Staging report skipped; live catalog untouched. Set supplier keys ' +
        'and run manually to produce a staging report.'
    );
    return;
  }
  // Imported lazily so the unconfigured path never pulls in Next.js-typed
  // supplier/library code under plain ts-node.
  const { searchAllSuppliers } = await import('../lib/suppliers/router');
  let total = 0;
  for (const q of QUERIES) {
    const { products, errors } = await searchAllSuppliers(q, { page: 1, limit: 20 });
    for (const e of errors) console.warn(`! ${e.supplier}: ${e.message}`);
    total += products.length;
    console.log(`${q}: ${products.length} staged candidate(s)`);
  }
  console.log(`Staging report complete: ${total} candidate(s) for human review. Live catalog untouched.`);
}

main().catch((err) => {
  console.error('Supplier sync failed:', err);
  process.exit(1);
});
