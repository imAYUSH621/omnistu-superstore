/** Normalize untrusted URL numbers before SQL, pagination and filter labels. */
export function searchPage(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(n) && n >= 1 && n <= 1_000_000 ? n : 1;
}

export function searchLimit(value: unknown, fallback = 24): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 200 ? value : fallback;
}

export function searchPrice(value: unknown): string {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?-\d+(?:\.\d{1,2})?$/.test(value)) return 'all';
  const [lo, hi] = value.split('-').map(Number);
  return Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi && hi <= 100_000_000 ? value : 'all';
}

export function searchRating(value: unknown): string {
  if (typeof value !== 'string' || !/^\d(?:\.\d+)?$/.test(value)) return 'all';
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 5 ? value : 'all';
}

export function searchSort(value: unknown): string {
  return typeof value === 'string' && ['newest', 'lowest', 'highest', 'rating'].includes(value) ? value : 'newest';
}
