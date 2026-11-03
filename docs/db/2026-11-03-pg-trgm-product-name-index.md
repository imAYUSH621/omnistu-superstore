# pg_trgm GIN index on Product.name (dev DB, applied 2026-11-03)

Additive, reversible, no data change. Applied to the omnistu-store-dev
Supabase database only (the dev DB backing preview deployments), under the
owner's Nov 2 approval for necessary non-destructive dev-DB upgrades with
backup, and the Nov 3 scalable-search request. Backup gen 78 predates it.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS product_name_trgm_idx ON "Product" USING gin (name gin_trgm_ops);
```

Why: the word-start search regex (`name ~* '\m<term>'`) is served by pg_trgm
GIN via literal trigram extraction plus recheck. Verified on the dev DB:
`Bitmap Index Scan on product_name_trgm_idx` with `Index Cond: name ~* '\mmen'`.
Without an index the scan is linear (~233 ms on a 200k-row generated set);
the 31-row table seq-scans in ~0.1 ms today, so this is headroom for catalog
growth, not a fix for current latency.

Undo: `DROP INDEX IF EXISTS product_name_trgm_idx;` (extension may stay;
dropping it needs the index dropped first and is unnecessary).

Not added to prisma/migrations: it is an unmanaged index and auto-applying it
through a deploy pipeline was not part of the approval. Applied manually via
the owner role over the pooler session connection.
