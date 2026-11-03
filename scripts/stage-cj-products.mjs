// READ-ONLY CJ Dropshipping staging. Pulls product list + detail for keyword queries and writes a
// review file. It never writes to any database, never places orders, never fetches shipping quotes.
//   CJ_API_KEY=... node scripts/stage-cj-products.mjs out.json "Category=keyword" "Category=keyword" ...
// Honesty rules: brand is always null (CJ has no manufacturer brand; supplierName is kept separately),
// stock is the supplier's variant inventory at fetch time (not a reservation, can be stale), price is the
// supplier COST. Missing fields are listed per item, never filled. retailPrice is NOT computed here because
// shipping and payment-fee inputs are unverified; see docs/catalog-staging.md.
import { writeFileSync } from 'node:fs';
import { createCjReadClient } from './lib/cj-read-client.mjs';
const BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const [out, ...specs] = process.argv.slice(2);
const key = process.env.CJ_API_KEY;
const existingToken = process.env.CJ_ACCESS_TOKEN;
if ((!key && !existingToken) || !out || !specs.length) { console.error('usage: CJ_API_KEY=... node scripts/stage-cj-products.mjs out.json "Category=keyword" ...'); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const call = createCjReadClient();
// A caller-managed, unexpired token avoids redundant authentication. No token response is written
// to disk or source, and auth failure never triggers a refresh/retry loop.
const tok = existingToken || (await call('/authentication/getAccessToken', null, { apiKey: key }))?.data?.accessToken;
if (!tok) { console.error('auth failed'); process.exit(1); }
const num = (v) => { const n = Number(String(v ?? '').split('--')[0]); return Number.isFinite(n) && String(v ?? '') !== '' ? n : null; };
const items = []; const seen = new Set(); const fetchedAt = new Date().toISOString();
for (const spec of specs) {
  const [category, keyword] = spec.split('=');
  const l = await call(`/product/list?productNameEn=${encodeURIComponent(keyword)}&pageNum=1&pageSize=3`, tok);
  for (const p of l?.data?.list ?? []) {
    if (seen.has(p.pid)) continue; seen.add(p.pid);
    await sleep(1200);
    const d = (await call(`/product/query?pid=${p.pid}`, tok))?.data;
    if (!d) { items.push({ pid: p.pid, targetCategory: category, error: 'detail unavailable' }); continue; }
    await sleep(1200);
    const inv = (await call(`/product/stock/getInventoryByPid?pid=${p.pid}`, tok))?.data;
    const warehouses = (inv?.inventories ?? []).map((w) => ({ area: w.areaEn, country: w.countryCode, total: w.totalInventoryNum ?? null, cj: w.cjInventoryNum ?? null, factory: w.factoryInventoryNum ?? null }));
    const perVariant = new Map((inv?.variantInventories ?? []).map((x) => [String(x.vid), x]));
    const variants = (d.variants ?? []).map((v) => ({ vid: v.vid, sku: v.variantSku, name: v.variantNameEn, cost: num(v.variantSellPrice), suggestedPrice: num(v.variantSugSellPrice), stockRaw: perVariant.get(String(v.vid)) ?? null, weightG: num(v.variantWeight) }));
    const images = [d.productImage, ...(Array.isArray(d.productImageSet) ? d.productImageSet : [])].filter(Boolean);
    const description = typeof d.description === 'string' ? d.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const missing = [];
    if (!description) missing.push('description');
    if (!images.length) missing.push('images');
    if (!variants.length) missing.push('variants');
    if (variants.some((v) => v.stockRaw === null)) missing.push('variant_stock');
    if (variants.some((v) => v.cost === null)) missing.push('variant_cost');
    items.push({ pid: d.pid, targetCategory: category, name: d.productNameEn, supplierCategory: d.categoryName, supplierName: d.supplierName ?? null, brand: null, description, images, sellPriceCostRange: d.sellPrice ?? null, warehouses, variants, stockFetchedAt: fetchedAt, imageLicense: 'unverified', missing, retailPrice: null, retailPriceReason: 'shipping, tax and payment fees unverified' });
  }
}
writeFileSync(out, JSON.stringify({ fetchedAt, source: 'CJ Dropshipping API (read-only)', items }, null, 2));
console.log(JSON.stringify({ items: items.length, withDescription: items.filter((i) => i.description).length, withStock: items.filter((i) => i.variants?.length && !i.missing.includes('variant_stock')).length, withMissing: items.filter((i) => i.missing?.length).length }));
