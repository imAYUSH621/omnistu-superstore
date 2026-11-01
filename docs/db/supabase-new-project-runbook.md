# Supabase store dev DB: lockdown-first runbook

Status: EXECUTED on 2026-11-01 for the dev project `omnistu-store-dev` (ap-south-1, existing free org, 2nd of 2 free slots; owner answered yes on WhatsApp 20:47; no spend, no Vercel env, no deploy, ECOM untouched). Original text follows. The owner's yes covered using the last free slot (free plan: 2 active projects, 500 MB each, pauses after 1 week of inactivity; verify current terms at https://supabase.com/pricing before acting). Never use the ECOM project. No production env, no deploy.

## Order (the public API must never see unlocked tables)
1. Re-check plan and project quota (Management API, read-only). Stop if cost appears.
2. Generate the DB password locally into a 0600 file. Never print it. Save it to the vault from that file, use it in the same step, then delete the file.
3. Create the project (dev, nonprod). Prefer creating with the Data API / exposed schemas disabled if the API offers it. If it does not, step 5 runs before any table exists.
4. Connect as the owner through the pooler (session mode for migrations, transaction mode with `?pgbouncer=true` for the app). Never log URLs or keys.
5. Before migrations: set default privileges so new tables are not granted to anon/authenticated:
   `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;` (same for sequences, functions).
6. `prisma migrate deploy` (all 9 migrations; fresh path verified locally, see docs/database-setup.md).
7. Run `docs/db/supabase-lockdown.sql` (RLS on, revoke anon/authenticated; idempotent; tested on a local scratch DB with stand-in roles, not on Supabase).
8. Verify: anon-key REST request to a Prisma table must be denied (check status only, no rows read); `/api/health` locally reports db ok.
9. Least privilege: create a non-owner app role with only the DML it needs; the app uses that role, migrations use the owner.
10. Set no Vercel env and do no deploy until the owner approves.

## Rollback
Pause or delete the dev project; nothing else depends on it.

## Not covered
Hosted-Supabase behaviour is unproven until step 8 runs for real. Pause-after-inactivity means this is a dev DB only.


## What was run (2026-11-01 20:50-20:53 IST)
1. Plan and quota re-checked live: org plan free, 1 org, 1 project (ECOM). Terms: https://supabase.com/docs/guides/platform/billing-faq (two active free projects; paused projects do not count) and https://supabase.com/docs/guides/platform/free-project-pausing (paused after about 7 days of low activity).
2. Owner and app-role passwords were generated into 0600 files, saved to the vault ("Omnistu Superstore dev DB (Supabase, owner)" and "... app role omnistu_app"), never printed.
3. Project created via the Management API (free org). Project was empty (0 public tables).
4. Default privileges revoked from anon/authenticated BEFORE any table existed. Then `prisma migrate deploy` over the session pooler (11 migrations). Then docs/db/supabase-lockdown.sql.
5. Verified: 13 public tables, RLS on for all 13; 0 table grants to anon/authenticated; a probe table created afterwards was not selectable by anon or authenticated (probe dropped); anon-key REST calls to User, Product, Order and ServiceEnquiry all returned 401 permission denied (status checked, no rows read); `prisma migrate diff` shows zero drift.
6. docs/db/supabase-app-role.sql: app role `omnistu_app` can read and write data but cannot run DDL or read _prisma_migrations (checked). Note RLS stays on; the file adds a policy only for this role.
7. App check against the dev DB with the app role over the transaction pooler (`?pgbouncer=true`): service enquiry POST saved and read back, then deleted; /services/websites 200. Local run only.

## Limits
Dev database only: it pauses after about a week of inactivity, it holds no real catalog or users, and nothing production uses it. Re-run supabase-lockdown.sql and supabase-app-role.sql after any migration that adds tables. The failed-migration health check is skipped for the app role (it cannot read _prisma_migrations).
