# Store database setup (status and steps)

Status as of 1 Nov 2026 (read-only checks, nothing changed):
- Checked: the Vercel project `omnistu-superstore` has NO `DATABASE_URL` env var, no database integration and no team shared env. Without it `db/prisma.ts` falls back to `localhost:5432`, which cannot exist on Vercel. So the deployed app cannot reach a configured Prisma database. This does not prove that no database exists anywhere (for example under another account); it proves the deployment is not wired to one. The catalog on the live pages renders from files/cache.
- The only Supabase project visible to the discovery token (ECOM) has none of this app's Prisma tables. Do not point `DATABASE_URL` at it.
- `GET /api/health` reports `db`: `ok`, `not_configured`, `down` or `schema_incomplete` (no counts or secrets). Verified locally against real Postgres for all four states.

Provider options researched (current terms, 1 Nov 2026):
- Supabase, existing account: the org is on the Free plan (read from the Management API). Free: 500 MB per project, 2 active projects (ECOM uses 1), and free projects pause after 1 week of inactivity, so it is a staging choice, not a store choice. Upgrading to Pro is paid.
  Source: https://supabase.com/pricing
- Neon: free plan with scale-to-zero compute (cold starts, no inactivity pause of data). The app already has a Neon adapter. It needs a new Neon account (new terms).
  Source: https://neon.com/pricing
- Supabase Postgres created for this app MUST run `docs/db/supabase-lockdown.sql` after migrating. Otherwise the project's public REST API exposes the tables (users, password hashes, orders) to the anon key. The script is verified locally (anon and authenticated lose all access; the owner role used by Prisma is unaffected).

To bring up a real database (needs an owner decision on provider and account; none created):
1. Create a Postgres database. Free tiers exist (for example Neon or a new Supabase project). Paid tiers and a new account or project are the owner's call.
2. Set `DATABASE_URL` in the host's env (the pooled URL for the app). Use the direct URL only for migrations if the provider needs it. Never commit it.
3. Take a backup if the database is not new, then run `npx prisma migrate deploy` (fresh DB: all 9 migrations apply, verified locally). Do not run `migrate dev` against a real database.
4. Optional demo data: `npm run db:seed` style script in `db/seed.ts` (check it first; it creates sample users).
5. On Supabase, run docs/db/supabase-lockdown.sql. Redeploy, then check `/api/health` returns `db: ok`.
6. Do not enable the fulfillment outbox or any supplier retry as part of this step.

## Putting products into a database (safe options)

How the store reads products: `getLatestProducts` / `getAllProducts` / `getProductBySlug` read the Product table first and fall back to the bundled demo sample data only when there is no database or it has no products. The demo data is not a real catalog.

- `npx tsx scripts/import-catalog.ts --file reviewed-products.json` is a dry run: it prints create/update/skip/invalid counts and writes nothing.
- Add `--apply` to create products for NEW slugs only. Existing products are left alone. Rows must already be Product-shaped (name, slug, category, brand, description, stock, price, images); stock and brand are never invented.
- Add `--update-existing` to also refresh name, description, images, brand, category and banner of existing slugs. Stock, price, rating and isFeatured are never overwritten. Nothing is ever deleted. Invalid rows block `--apply`.
- `--from-sample` imports the demo products (for a development database).
- `db/seed.ts` DELETES products, users, sessions and accounts. It now refuses unless the database host is local (or `ALLOW_DESTRUCTIVE_SEED=1` is set) and refuses in production.

Stock semantics today: the cart checks stock when an item is added; stock is decremented only when an order is marked paid, with no floor, so two paid orders can take the last unit and stock can go below zero. `/admin/reconciliation` lists such products read-only. Whether to refund, backorder or reserve at checkout is an owner policy decision and is not implemented.

### Real catalog import readiness (recorded, not imported)

`public/data/catalog_unified.json` has 22 items with: id, title, price, image and thumbnails, category, rating, review count. It has NO brand, description or stock, and no supplier or product mapping. `lib/catalog-readiness.ts` maps what exists (name, slug from id, category, price, images) and invents nothing; ratings and review counts are not mapped because they are unverified claims. Result today: 22 total, 0 importable, 22 invalid (missing brand, description, stock). No authorized in-repo source supplies them; supplier APIs (CJ, Printify) need keys that are not available to this work, and nothing was bought or called. `catalog.json` (60) and `bestsellers.json` (100) are not referenced by any code and carry no brand or stock either. Nothing was imported; the JSON fallback is unchanged.

## Catalog source: database vs sample data
Product reads use the database only when `DATABASE_URL` is a non-local URL (a localhost URL is treated as "no database" so serverless hosts do not hang). Otherwise the bundled sample data is served. For local runs against a local Postgres, set `ALLOW_LOCAL_DATABASE=1` (never on a host). `/api/health` returns `catalogSource: "database" | "sample"` so a browser test cannot silently pass on sample data: assert it is `database` first.
