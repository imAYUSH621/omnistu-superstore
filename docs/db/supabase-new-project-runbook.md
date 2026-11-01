# Supabase store dev DB: lockdown-first runbook (NOT executed)

Status: prepared locally. No project has been created. Needs the owner's yes on using the last free slot (free plan: 2 active projects, 500 MB each, pauses after 1 week of inactivity; verify current terms at https://supabase.com/pricing before acting). Never use the ECOM project. No production env, no deploy.

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
