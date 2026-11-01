# Store database setup (status and steps)

Status as of 1 Nov 2026 (read-only checks, nothing changed):
- The Vercel project `omnistu-superstore` has NO `DATABASE_URL` env var, no database integration and no team shared env. Without it `db/prisma.ts` falls back to `localhost:5432`, which cannot exist on Vercel. So users, carts and orders have no database in production. The catalog renders from files/Supabase cache, not from this database.
- The only Supabase project visible to the discovery token (ECOM) has none of this app's Prisma tables and is not this app's database. Do not point `DATABASE_URL` at it.
- `GET /api/health` now reports `db`: `ok`, `not_configured`, `down` or `schema_incomplete` (no counts or secrets). Verified locally against real Postgres for all four states.

To bring up a real database (needs an owner decision on provider and account; none created):
1. Create a Postgres database. Free tiers exist (for example Neon or a new Supabase project). Paid tiers and a new account or project are the owner's call.
2. Set `DATABASE_URL` in the host's env (the pooled URL for the app). Use the direct URL only for migrations if the provider needs it. Never commit it.
3. Take a backup if the database is not new, then run `npx prisma migrate deploy` (fresh DB: all 9 migrations apply, verified locally). Do not run `migrate dev` against a real database.
4. Optional demo data: `npm run db:seed` style script in `db/seed.ts` (check it first; it creates sample users).
5. Redeploy, then check `/api/health` returns `db: ok`.
6. Do not enable the fulfillment outbox or any supplier retry as part of this step.
