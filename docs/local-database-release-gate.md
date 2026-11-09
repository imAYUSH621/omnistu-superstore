# Disposable database release gate

CI now starts PostgreSQL 14, applies the complete Store migration chain to
`omnistu_test_ci`, then runs the unit and real database tests together. The
later production build still receives no database or provider credentials.
There is no deployment step or cloud credential in this workflow.

Mutating database suites require all of:

- `OMNISTU_LOCAL_DB_TEST=true`;
- identical `DATABASE_URL` and `REFUND_ITEST_DATABASE_URL`;
- a PostgreSQL URL on localhost, 127.0.0.1 or ::1;
- an explicitly disposable database name beginning `omnistu_test_`.

The CI password is a fixed disposable service value, not a saved account or
external secret. Never point this gate at an owner-hosted database. The
integration tests include schema failure injection, simulated orders and
local synthetic identities, so the database must be discarded after the run.
Their cleanup is not a guarantee that a reused database is empty. CI removes
the service container with the job. Manual runs use a fresh database each time.

`localPsqlUrl` removes Prisma-only query options before psql is invoked.
Missing auth-limit migrations fail instead of silently returning from an
assertion. Search tests create their own category data and explicitly use
the real local SQL path rather than silently exercising sample data. The
ordinary shopping lifecycle rejects real return creation from a simulated
receipt, matching the shipped action rather than its obsolete expectation.

## What the gate establishes

Real PostgreSQL transactions exercise ordinary cart ownership and transfer,
server-priced order creation, simulated paid transitions, stock races,
qualified variant allocation, duplicate protection, refund and payment
reconciliation/rollback, reset/session-version and role-change atomicity,
SQL search/facets and exclusion of simulated sales.

The test files state their mocked boundaries. These include authenticated
sessions, request cookies, framework navigation, external payment providers,
email, mirrors and supplier dispatch as needed. A mocked completed capture
is not proof of an actual provider capture. Local database success is not
hosted browser E2E, production role qualification, merchant readiness,
customer mail delivery, real refund execution or dispatch proof.

With no explicit local gate the database suites remain skipped. Report that
count separately from a database-enabled run. Neither passing local tests
nor a green CI run enables production orders, payments, supplier calls,
mail, listing, Services publication or an account upgrade.
