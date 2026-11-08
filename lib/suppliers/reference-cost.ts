/** A listing cost is reference evidence only. Unknown must not become zero.
 * Do not strip punctuation/signs or collapse ranges into one invented amount.
 * Exact destination freight and merchant costs are qualified separately. */
export function parseReferenceCost(value: unknown): number | null {
  if (typeof value === 'string') {
    if (!/^\s*\d+(?:\.\d+)?\s*$/.test(value)) return null;
    value = Number(value);
  }
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER / 100
    ? value : null;
}
