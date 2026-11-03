/**
 * Provider-neutral catalog text matching.
 *
 * Plain substring search leaks unrelated products: a query for "men" also
 * matches "women", "supercharger" matches "charger" backwards, etc. The
 * storefront therefore matches on WORD STARTS: the (trimmed, case-insensitive)
 * query must appear in the product name starting at a word boundary. Suffix
 * continuation is allowed, so "charg" still finds "Charging" and "charger"
 * finds "Chargers", while "men" no longer finds "Women".
 *
 * Deterministic: same name + same query always gives the same answer; no
 * scoring, no ranking claims.
 */
export function queryMatchesName(name: string, query: string): boolean {
  const q = (query || '').trim();
  if (!q || q === 'all') return true;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word-start boundary: preceded by start-of-string or a non-alphanumeric char.
  return new RegExp(`(^|[^a-z0-9])${escaped}`, 'i').test(name);
}
