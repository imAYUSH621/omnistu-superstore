import { Offer, OfferDecision } from './types';

/**
 * Deterministic conflict resolution when several providers quote the same
 * variant (same variantKey). No scoring model, no quality claims: the winner
 * is picked by a fixed, explainable order:
 *   1. eligibility: fresh (age <= maxAgeMs) and stock > 0
 *   2. lowest total (price + shipping when known; unknown shipping = price)
 *   3. fresher quote (fetchedAt desc)
 *   4. provider priority list order (if supplied)
 *   5. provider then providerSku, lexicographic (stable final tiebreak)
 * Ties beyond rule 5 are impossible (provider+providerSku is unique per row).
 */
export function selectOffer(
  offers: Offer[],
  now: Date,
  opts: { maxAgeMs: number; providerPriority?: string[] }
): OfferDecision {
  const considered = offers.map((offer) => {
    const reasons: string[] = [];
    const ageMs = now.getTime() - new Date(offer.fetchedAt).getTime();
    let eligible = true;
    if (ageMs > opts.maxAgeMs) { eligible = false; reasons.push('stale quote'); }
    if (offer.stock <= 0) { eligible = false; reasons.push('out of stock'); }
    if (eligible) reasons.push('eligible');
    return { offer, eligible, reasons };
  });

  const pool = considered.filter((c) => c.eligible).map((c) => c.offer);
  pool.sort((a, b) => {
    const ta = a.priceCents + (a.shippingCents ?? 0);
    const tb = b.priceCents + (b.shippingCents ?? 0);
    if (ta !== tb) return ta - tb;
    const fa = new Date(a.fetchedAt).getTime();
    const fb = new Date(b.fetchedAt).getTime();
    if (fa !== fb) return fb - fa;
    const pa = opts.providerPriority?.indexOf(a.provider) ?? -1;
    const pb = opts.providerPriority?.indexOf(b.provider) ?? -1;
    if (pa !== pb) return (pa === -1 ? Number.MAX_SAFE_INTEGER : pa) - (pb === -1 ? Number.MAX_SAFE_INTEGER : pb);
    if (a.provider !== b.provider) return a.provider < b.provider ? -1 : 1;
    return a.providerSku < b.providerSku ? -1 : 1;
  });

  return { selected: pool[0] ?? null, considered };
}
