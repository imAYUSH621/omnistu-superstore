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
