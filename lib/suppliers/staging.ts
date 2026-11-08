import type { NormalizedProduct } from './types';
/** Candidate records retain source reference costs and stock evidence but never
 * carry guessed retail prices. An env-wide shipping allowance is not a quote.
 * Only the separate exact-variant/destination qualification path can approve
 * retail offers. Supplier retail values do not establish merchant margins. */
export function supplierStagingCandidate(p: NormalizedProduct, sourceQuery: string) {
  return {
    ...p,
    retailPrice: null,
    estimatedMarginPct: null,
    retailPriceInr: null,
    sourceQuery,
    status: 'pending_review' as const,
    reviewChecklist: ['exact variant and buyer copy verified', 'images licensed/usable', 'warehouse/factory stock and handling confirmed', 'exact destination freight and method confirmed', 'all seller costs, fees and returns provision explicit', 'retail price approval recorded'],
  };
}
