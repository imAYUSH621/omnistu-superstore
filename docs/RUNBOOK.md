# OMNISTU Superstore - Operations Runbook

> Current-state correction, 9 Nov 2026: the Store already has a healthy existing database. Read [current environments](current-environments.md) before following the historical setup or pending-migration notes below. Do not create a duplicate database or enable live effects from those older notes.

Last updated: 2026-11-01. Covers development, CI, deployment, rollback,
database migrations and backups for `imAYUSH621/omnistu-superstore`.

## 1. Local development

```bash
npm ci
npx prisma generate
cp .example-env .env   # fill in only what the task needs
npm run dev
```

Quality gates (all must pass before pushing):

```bash
npx tsc --noEmit
npx jest
npm run build        # must pass with zero secrets configured
```

## 2. CI

`.github/workflows/ci.yml` runs type check, tests and a production build on
every push to `main` and every pull request. The workflow holds no cloud
credentials and has no deploy step: merging code never publishes anything.

## 3. Deployment

- Deploys are explicit, manual actions only. No GitHub integration, webhook
  or workflow deploys automatically; verify this stays true if CI changes.
- Target: the separate Vercel account's Super Store project only, using its
  dedicated token from the credential vault. Never deploy to any other
  Vercel account or project.
- The account is on the Hobby (free) plan. Vercel's Hobby terms do not
  permit commercial use: fine for testing, not for a commercial launch.
  Upgrading is a spending decision for the owner.
- Deploy command shape (from a clean checkout of the commit to deploy):

```bash
npx tsc --noEmit && npx jest && npm run build
vercel deploy --prebuilt --prod --token "$VERCEL_SUPER_STORE_TOKEN"
```

- Prebuilt deploys bundle the Prisma query engine of the BUILD machine. The
  Vercel runtime is Amazon Linux (`rhel-openssl-3.0.x`), so building on any
  other platform without the rhel engine produces a deployment whose every
  database call fails at runtime. `binaryTargets` in `prisma/schema.prisma`
  pins both engines; after any Prisma upgrade, confirm the generated client
  still contains `libquery_engine-rhel-openssl-3.0.x.so.node` before
  deploying. (2026-11-11: a deploy without it took omnistu.com database
  reads down for ~9 minutes until redeployed with the engine.)

- Commerce stays in test mode until the owner supplies live payment keys
  and approves going live.

## 4. Rollback

- Every change reaches `main` through a reviewed pull request. To roll back
  a change, revert its merge commit and merge that revert PR:

```bash
git revert -m 1 <merge-commit-sha>
git push origin main
```

- To roll back a deployment, redeploy the previous known-good deployment
  from the Vercel dashboard (Deployments -> previous -> Promote) or redeploy
  the previous commit with the command above.
- Known-good baseline before the 2026-11-01 fix program: `0ec1984`.

## 5. Database migrations

- Migrations live in `prisma/migrations/`. They are never applied
  automatically by CI.
- Apply only to an environment the owner has explicitly authorized, and
  only after a backup of that database exists.
- Pending: `20261101031425_order_fulfillment_idempotency` (order
  fulfillment idempotency). Not applied anywhere yet.

## 6. Backups

- A git bundle of all branches plus a manifest and checksums is kept in the
  owner's private Instinct File "Super Store branch backup 2026-11".
- Restore any branch from the bundle:

```bash
git bundle verify superstore-branches-2026-11-01.bundle
git fetch superstore-branches-2026-11-01.bundle refs/heads/main:refs/heads/restored-main
```

## 7. Monitoring

- No production monitoring is configured yet (nothing is deployed to
  production). When a first real deployment exists, add Vercel's built-in
  analytics and an uptime check before calling it launched.
