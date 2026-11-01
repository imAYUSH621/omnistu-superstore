/**
 * Safe, additive catalog import into the Product table.
 *
 *   npx tsx scripts/import-catalog.ts --file reviewed-products.json            (dry run, writes nothing)
 *   npx tsx scripts/import-catalog.ts --file reviewed-products.json --apply    (creates NEW slugs only)
 *   ... --update-existing   (also refresh name/description/images/brand/category/banner of existing slugs)
 *   npx tsx scripts/import-catalog.ts --from-sample [--apply]                  (the demo products)
 *
 * Never deletes. Never overwrites stock, price, rating or isFeatured of an
 * existing product. Rows must already be Product-shaped (name, slug, category,
 * brand, description, stock, price, images): stock and brand are never invented.
 * Prints counts and slugs only, never connection details.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import sampleData from '../db/sample-data';
import { planCatalogImport, UPDATABLE_FIELDS, type ImportRow } from '../lib/catalog-import';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const updateExisting = args.includes('--update-existing');
  const fi = args.indexOf('--file');
  let rows: ImportRow[];
  if (args.includes('--from-sample')) rows = sampleData.products as ImportRow[];
  else if (fi >= 0 && args[fi + 1]) {
    const parsed = JSON.parse(readFileSync(args[fi + 1], 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('File must contain a JSON array of products');
    rows = parsed;
  } else throw new Error('Provide --file <products.json> or --from-sample');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

  const prisma = new PrismaClient();
  try {
    const existing = new Set((await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug));
    const plan = planCatalogImport(rows, existing, updateExisting);
    console.log(`${apply ? 'APPLY' : 'DRY RUN'}: create ${plan.create.length}, update ${plan.update.length}, skip existing ${plan.skipExisting.length}, invalid ${plan.invalid.length}`);
    for (const i of plan.invalid) console.log(`  invalid #${i.index} ${i.slug}: ${i.error}`);
    if (!apply) return console.log('Nothing written. Re-run with --apply to write.');
    if (plan.invalid.length) throw new Error('Refusing to apply while rows are invalid. Fix the file first.');
    for (const r of plan.create) await prisma.product.create({ data: r as never });
    for (const r of plan.update) {
      const data: Record<string, unknown> = {};
      for (const f of UPDATABLE_FIELDS) data[f] = (r as Record<string, unknown>)[f];
      await prisma.product.update({ where: { slug: String(r.slug) }, data });
    }
    console.log('Done. Nothing was deleted.');
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error('import failed:', e instanceof Error ? e.message : 'error');
  process.exit(1);
});
