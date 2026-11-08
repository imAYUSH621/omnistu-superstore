# Current Store environments

Checked 9 November 2026. This supersedes the initial 1 November discovery in `database-setup.md` and the old pending-migration notes in `RUNBOOK.md`.

## Reuse what exists

- The Supabase account lists two projects: **ECOM** is inactive; **omnistu-store-dev** is healthy and hosts the current Store database. Its name includes `dev`, but that does not make it a disposable database.
- The current public Store uses the existing `public` schema with 16 application tables and the restricted application role. `/api/health` reports a healthy database. Do not create a new database or point production at ECOM merely because an older document says setup is missing.
- Eight `itest_*` schemas are inside that same active project. They are isolated qualification data and do not represent eight new Supabase projects. A hosted test result is not proof that a feature is enabled on the public Store.
- Production payment, supplier dispatch and customer email remain OFF. Qualified-variant simulated checkout was exercised separately and is not enabled on the public deployment.
- The contact form and Services enquiry intake reuse the existing `ServiceEnquiry` table. Guest records have no account binding; signed-in records use the authenticated user id. The administrator's protected enquiry list and the customer's own enquiry list use this existing record. Saving is not emailing, a reply or a promised response time.

## Before a change

Read the current project, deployment and database state. Keep the existing database connection and audience unless the task requires a change. Verify the target schema explicitly. Back up and verify restoration before a production migration, and apply only the migration that the release actually needs. Do not seed production with sample products or copy isolated test users into production. Do not grant the public application access to all test schemas.

Keep test environments only as long as they support a concrete verification or recovery need. Review dependencies and retained evidence before removing one; do not delete schemas merely to make the inventory look simpler.

## Account readiness is separate from engineering

The Vercel team name is not its billing plan. At this check the existing team is on Hobby. Resolve commercial-hosting eligibility before commercial operation, without silently upgrading or opening another account. The existing NVIDIA API trial is not a production entitlement. Neither issue requires another Supabase project and neither is a reason to stop unrelated test-only Store engineering.

Policy sources checked on 9 November 2026:
- https://vercel.com/docs/limits/fair-use-guidelines.md
- https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf

## Required production connection release gate

On 9 November at 04:00 IST, Supavisor logs confirmed the existing application role had reached the session-mode client cap. A static page rendering correctly was not evidence of database readiness. The unchanged public build was recovered using the same database, role and public schema on the shared transaction pool. No privilege, capacity, account or project-wide setting was changed.

Every later production deployment must preserve that per-deployment runtime override: existing pooler host, port `6543`, `pgbouncer=true`, `connection_limit=1` and `pool_timeout=10`. Do not inherit the project-level session-mode URL merely because a previous deployment was healthy. Do not print the connection value in build output or a handoff. Migrations, backups and session-dependent queue workers need their own reviewed connection mode; this runtime requirement does not authorize changing them.

Before promotion, check the exact source and final deployment, then require healthy `/api/health` and connection-dependent search/category reads plus the auth/guest boundaries. Recheck after promotion and retain the preceding deployment. Do not promote a candidate whose database check fails just because static pages pass. A short healthy run is not proof of indefinite stability.

Verified guidance:
- https://supabase.com/docs/guides/database/prisma
- https://supabase.com/docs/guides/database/connecting-to-postgres
