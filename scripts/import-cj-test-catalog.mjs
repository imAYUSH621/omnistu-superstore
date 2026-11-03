// Import a bounded CJ test catalog into the DEV database for owner acceptance
// testing (TEST_CHECKOUT_MODE). Every row gets slug prefix cjt- so code can
// gate it: simulated checkout only, never a retail offer. Price = supplier
// cost * 1.3 (demo markup, clearly labeled in the UI). Supplier images and
// claims stay unverified. Idempotent upsert by slug/sku; touches ONLY cjt-
// rows. Read-only towards CJ: list/detail/inventory, no orders, no quotes.
// Responses are cached in .cache/cj/ so re-runs do not re-hit the API.
//   CJ_API_KEY=... DATABASE_URL=... node scripts/import-cj-test-catalog.mjs
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const CACHE = '.cache/cj';
const PER_CATEGORY = 3;
const MARKUP = 1.3;
const key = process.env.CJ_API_KEY;
if (!key) { console.error('CJ_API_KEY required'); process.exit(2); }
mkdirSync(CACHE, { recursive: true });

// Gourmet & Indian Food intentionally omitted: CJ getCategory has no
// food/grocery and Nov-1 keyword searches returned no edible product.
const SPECS = [
  ['Tech & Gadgets', 'wireless earbuds'],
  ['Jewelry & Watches', 'women watch'],
  ['Home & Lifestyle', 'led night light'],
  ['Custom Apparel', 'hoodie men'],
  ['Toys & Games', 'fidget toy'],
  ['Beauty & Personal Care', 'facial massager'],
  ['Health & Wellness', 'posture corrector'],
  ['Baby & Kids', 'baby toy'],
  ['Sports & Outdoors', 'camping light'],
  ['Pet Supplies', 'pet toy'],
  ['Books & Stationery', 'notebook journal'],
  ['Arts & Crafts', 'diy craft kit'],
  ['Musical Instruments', 'kalimba'],
  ['Household Essentials', 'storage organizer'],
  ['Garden & Patio', 'garden solar light'],
  ['Automotive & Tools', 'car phone holder'],
  ['Luggage & Travel', 'travel backpack'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(path, tok, body, cacheKey) {
  const file = `${CACHE}/${cacheKey}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let i = 0; i < 3; i++) {
    const res = await fetch(BASE + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(tok ? { 'CJ-Access-Token': tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const j = await res.json().catch(() => ({}));
    if (j.code === 1600200 || res.status === 429) { await sleep(1500 * (i + 1)); continue; }
    writeFileSync(file, JSON.stringify(j));
    return j;
  }
  return { result: false, message: 'rate limited' };
}
const num = (v) => { const n = Number(String(v ?? '').split('--')[0]); return Number.isFinite(n) && String(v ?? '') !== '' ? n : null; };

const auth = await call('/authentication/getAccessToken', null, { apiKey: key }, 'auth');
const tok = auth?.data?.accessToken;
if (!tok) { console.error('auth failed:', auth?.message); process.exit(1); }

const prisma = new PrismaClient();
const seen = new Set();
let imported = 0, skipped = 0;
for (const [category, keyword] of SPECS) {
  const l = await call(`/product/list?productNameEn=${encodeURIComponent(keyword)}&pageNum=1&pageSize=${PER_CATEGORY}`, tok, null, `list-${keyword.replace(/\W+/g, '_')}`);
  let list = l?.data?.list ?? [];
  if (!list.length) { console.log(`NO RESULTS: ${category} (${keyword})`); continue; }
  // CJ keyword search is loose: drop candidates whose name shares no keyword token.
  const tokens = keyword.split(/\s+/).filter((t) => t.length > 2);
  const relevant = list.filter((p) => { const n = String(p.productNameEn ?? '').toLowerCase(); return tokens.some((t) => n.includes(t)); });
  if (!relevant.length) { console.log(`NO RELEVANT: ${category} (${keyword}) - all ${list.length} candidates mismatched`); continue; }
  if (relevant.length < list.length) console.log(`relevance filter: ${category} kept ${relevant.length}/${list.length}`);
  list = relevant;
  for (const p of list) {
    if (seen.has(p.pid)) { skipped++; continue; }
    seen.add(p.pid);
    await sleep(1200);
    const d = (await call(`/product/query?pid=${p.pid}`, tok, null, `detail-${p.pid}`))?.data;
    if (!d) { skipped++; continue; }
    await sleep(1200);
    const inv = (await call(`/product/stock/getInventoryByPid?pid=${p.pid}`, tok, null, `inv-${p.pid}`))?.data;
    // variantInventories[x].inventory is a per-country array with totalInventory;
    // some payloads instead carry a flat totalInventoryNum. Sum what exists.
    const variantStock = (x) => {
      if (!x) return 0;
      if (Array.isArray(x.inventory)) return x.inventory.reduce((a, c) => a + (Number(c?.totalInventory) || 0), 0);
      return Number(x.totalInventoryNum) || 0;
    };
    const perVariant = new Map((inv?.variantInventories ?? []).map((x) => [String(x.vid), x]));
    const variants = (d.variants ?? []).map((v) => ({
      vid: String(v.vid), sku: v.variantSku, name: v.variantNameEn ?? '',
      cost: num(v.variantSellPrice), stock: variantStock(perVariant.get(String(v.vid))),
    })).filter((v) => v.cost !== null);
    if (!variants.length) { console.log(`SKIP (no priced variants): ${d.productNameEn?.slice(0, 60)}`); skipped++; continue; }
    const images = [d.productImage, ...(Array.isArray(d.productImageSet) ? d.productImageSet : [])].filter(Boolean).slice(0, 4);
    const description = typeof d.description === 'string' ? d.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000) : '';
    const minCost = Math.min(...variants.map((v) => v.cost));
    const price = Math.round(minCost * MARKUP * 100) / 100;
    const stock = variants.reduce((a, v) => a + v.stock, 0);
    const slug = `cjt-${d.pid}`;
    const product = await prisma.product.upsert({
      where: { slug },
      create: { slug, name: (d.productNameEn ?? 'Unnamed').slice(0, 200), category, brand: null, description: description || '(no supplier description)', images, price, stock, rating: 0, numReviews: 0 },
      update: { name: (d.productNameEn ?? 'Unnamed').slice(0, 200), category, description: description || '(no supplier description)', images, price, stock },
    });
    for (const v of variants.slice(0, 20)) {
      const sku = `cjt-${d.pid}-${v.vid}`;
      await prisma.productVariant.upsert({
        where: { sku },
        create: { sku, productId: product.id, name: (v.name || v.sku || 'default').slice(0, 120), referenceCost: v.cost, supplierStock: v.stock },
        update: { referenceCost: v.cost, supplierStock: v.stock },
      });
    }
    imported++;
    console.log(`OK: ${slug} | ${category} | $${price} (cost ${minCost}) | stock ${stock} | ${String(d.productNameEn).slice(0, 50)}`);
  }
}
console.log(JSON.stringify({ imported, skipped, categories: SPECS.length }));
await prisma.$disconnect();
