# Category query qualification

## Scope

No production table, index or cache changes in this qualification. The category metadata read is now deduplicated only within one React server-render request. Separate requests still read current database state. Product prices, stock, search results and checkout reads have no new cache.

## Live isolated schema, read-only

`current_schema()` confirmed `itest_preview` before `EXPLAIN (ANALYZE, BUFFERS)`. Only one Product row existed and the public fixture filter excluded it. Category grouping, category latest/price pages, word-start search and facet aggregation used sequential scans. Execution ranged from 0.046ms to 1.069ms. This tiny empty-public-catalog result cannot qualify production-scale behavior. The isolated schema has id/slug indexes but lacks public's name trigram index, another fidelity limit. No live indexes were added.

## Disposable synthetic experiment

100,000 generated rows across 18 categories; no copied production data. Temporary table and indexes rolled back after measurement. Illustrative single runs, not production speed claims:

| Query | Before | Candidate index | After |
| --- | ---: | --- | ---: |
| category latest, limit 12 | 9.845ms | category, createdAt DESC, id ASC | 0.028ms |
| category price range, limit 12 | 11.589ms | category, price ASC, id ASC | 0.028ms |

These preliminary queries omit the public fixture-prefix predicates. Plans and timings do not yet justify a live migration. A representative retained dataset, full query predicates, ascending/descending sort cases, write overhead and rollback must be qualified first.

## Cache invalidation audit

Category metadata is consumed by header search, category drawer, department ribbon, all-departments and search page. Product writes exist in admin CRUD, review aggregation, paid settlement/refund stock changes, seed and import scripts. A persistent category/facet cache would require a complete mutation/invalidation contract, including script writes. Per-request React deduplication avoids this cross-request invalidation problem. It is not a stock/price freshness guarantee and not a supplier API cache.
