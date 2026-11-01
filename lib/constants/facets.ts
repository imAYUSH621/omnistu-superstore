export const FACET_PRICE_BUCKETS = ['0-25', '25-50', '50-100', '100-500'] as const;
export const FACET_RATINGS = [4, 3, 2, 1] as const;
export type FacetCounts = { price: Record<string, number>; rating: Record<string, number> };
