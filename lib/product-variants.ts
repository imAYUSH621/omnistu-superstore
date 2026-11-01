/**
 * Replace the raw variants with a summary the cards can show: how many options
 * exist and the lowest supplier reference cost. Never a retail price.
 */
export function withVariantSummary<T extends { variants?: { referenceCost: unknown }[] }>(p: T) {
  const { variants = [], ...rest } = p;
  const costs = variants
    .map((v) => (v.referenceCost == null ? NaN : Number(v.referenceCost)))
    .filter((n) => Number.isFinite(n));
  return {
    ...rest,
    variantCount: variants.length,
    variantCostFrom: costs.length ? Math.min(...costs).toFixed(2) : null,
  };
}
