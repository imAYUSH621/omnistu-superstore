/**
 * Database-level word-start matching (PostgreSQL).
 *
 * Same semantics as lib/search-match.ts but evaluated in SQL so filtering,
 * counting, pagination and facet counts all happen in the database and stay
 * correct at any catalog size. The pattern is a case-insensitive POSIX regex
 * anchored at a word start (\m). All user input is regex-escaped and passed
 * as a bound parameter - nothing is interpolated.
 */
export function wordStartPattern(query: string): string {
  const q = (query || '').trim();
  // Escape POSIX regex metacharacters so the query is always literal text.
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `\\m${escaped}`;
}
