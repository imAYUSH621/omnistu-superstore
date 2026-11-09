# Manual fulfillment outbox claim checkpoint

This module remains preparation only and is not wired to a live dispatcher, scheduler or provider. The separate pg-boss catalog-preparation workflow is unchanged. No commercial activation or exactly-once external-effects guarantee is implied.

Two races were reproduced on a fresh disposable loopback Postgres database with synthetic zero-dollar orders and an inert runner:
- Eight concurrent same-order/supplier enqueue calls produced six active rows before this change.
- Two drains synchronized after real database SELECTs invoked the inert runner twice for the same row before this change.

Enqueue now locks the existing order row within the caller's transaction, or a new bounded transaction when no transaction is supplied. Active-task deduplication includes PROCESSING. Each drain atomically changes a still-due PENDING/RETRYING task to PROCESSING before invoking the runner. A competing drain skips a lost claim.

A failed success acknowledgement leaves PROCESSING held instead of converting an uncertain completed effect into an automatic retry. PROCESSING tasks are not automatically reclaimed after a crash. Manual reconciliation and provider-side idempotency would be required before any future live runner; neither is implemented or enabled by this change. Runner exceptions retain the existing bounded retry/failed-exception behavior, which does not establish that an external effect did not occur. No provider calls are made by these tests or this module.

Qualification: five actual disposable-Postgres checks cover concurrent enqueue, overlapping drains, failed acknowledgement hold/deduplication, exception record and caller-transaction rollback. Sixteen focused unit checks, all 221 suites / 1925 tests with zero skips, TypeScript, lint and 57 node checks pass. All migrations were applied only to the new disposable database; it was removed and the owned local database process stopped. No hosted build, merge, production deployment, database migration or queue activation is claimed by these local results.
