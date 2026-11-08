# Store catalog preparation pilot

The Store reuses pg-boss 12.38.1 with its Prisma 6 transaction adapter. This is a manual preparation workflow, not autonomous listing or publication.

- `/admin/catalog-preparation` and both server actions require the existing admin session. Production shows a disabled notice and does not touch a queue.
- The shared workflow reads retained `QualifiedCatalogPreparation` inputs, queues an existing 64-character record ID and processes at most one job per explicit action. It never accepts original evidence in a web request.
- The context gate accepts only the previously qualified local schema or the existing protected hosted TESTONLY preview schema `itest_catalog_queue_20261107`. Wrong database, role, environment or schema refuses before execution. No migrations, schemas, roles, providers, schedulers or production queue are created by this release.
- Enqueue and the retained-source check share a transaction. Queue claim, result ledger and completion share a transaction. Existing results stop replays; concurrent enqueue is deduplicated. A source is revalidated at execution time. Stale inputs yield HOLD, not a refreshed quote.
- `PREPARED_ONLY` is never publication approval. References and hashes do not establish owner authority or asset rights. Publication still needs independently recovered commercial approval, exact variants, route/cost/stock evidence, product copy/assets and current business terms.
- No supplier calls, price inference, catalog writes, real orders, payments or emails are part of this workflow.
- `/api/catalog-preparation-test` is only for protected preview qualification. It independently checks the existing automation caller credential and the same exact isolated context, then calls the same shared workflow as admin. Public production returns disabled. It is not a back door into admin or arbitrary SQL.

No new database or Google account is needed for the pilot. Existing isolated evidence and queue schemas were already provisioned. Do not run historical provisioning scripts again. Production activation and public catalog publication remain separate decisions and are not covered by this pilot.
