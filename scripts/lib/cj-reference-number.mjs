// Exact variant costs and weights must be scalar source values. Listing ranges
// are not exact variant evidence, and blanks, booleans and negatives are not 0.
export function parseCjReferenceNumber(value) {
  if (typeof value === 'string') {
    if (!/^\s*\d+(?:\.\d+)?\s*$/.test(value)) return null;
    value = Number(value);
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER / 100) return null;
  return value;
}
