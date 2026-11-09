import { Offer, OfferDecision } from './types';

/**
 * Deterministic conflict resolution when several providers quote the same
 * variant (same variantKey). An offer total is a supplier item+shipping quote,
 * NEVER a landed cost: duty and tax are unknown and must not be treated as 0,
 * and an offer with unknown shipping has no comparable total at all.
 *
 * Eligibility (fail closed - an ineligible offer is reported, never guessed):
 *   - valid fetchedAt (invalid or future-beyond-skew timestamps excluded)
 *   - quote age <= maxAgeMs
 *   - stock > 0 (stock is supplier-reported, never fabricated)
 *   - currency matches the requested comparison currency
 *   - shippingCents known, so the total is comparable across providers
 *
 * Ranking among eligible offers, fixed and explainable:
 *   1. lowest comparable total (price + known shipping)
 *   2. fresher quote (fetchedAt desc)
 *   3. provider priority list order (if supplied)
 *   4. provider then providerSku, lexicographic (stable final tiebreak)
 *
 * The decision always states what its totals do NOT cover (duty, tax, and any
 * excluded unknowns), so no caller can present the winner as a best deal.
 */

const FUTURE_SKEW_MS = 5 * 60 * 1000;

export function selectOffer(
  offers: Offer[],
  now: Date,
  opts: { maxAgeMs: number; currency?: 'USD'; providerPriority?: string[]; variantKey?:string;quantity?:number }
): OfferDecision {
  const currency = opts.currency ?? 'USD';
  const quantity=opts.quantity??1;
  const validContext=Number.isSafeInteger(quantity)&&quantity>0&&Number.isFinite(now.getTime())&&Number.isFinite(opts.maxAgeMs)&&opts.maxAgeMs>0;
  const keys=new Set(offers.map(o=>o.variantKey));
  const target=opts.variantKey??(keys.size===1?[...keys][0]:null);
  const considered = offers.map((offer) => {
    const reasons: string[] = [];
    let eligible = true;
    if(!validContext){eligible=false;reasons.push('invalid comparison bounds')}
    if(!target){eligible=false;reasons.push('explicit single variant required')}
    else if(offer.variantKey!==target){eligible=false;reasons.push('different variant identity')}
    if(!Number.isSafeInteger(offer.priceCents)||offer.priceCents<0){eligible=false;reasons.push('invalid item cost')}
    if(offer.shippingCents!==undefined&&(!Number.isSafeInteger(offer.shippingCents)||offer.shippingCents<0)){eligible=false;reasons.push('invalid shipping cost')}
    if(offer.shippingCents!==undefined&&!Number.isSafeInteger(offer.priceCents*quantity+offer.shippingCents)){eligible=false;reasons.push('invalid comparable total')}
    const t = new Date(offer.fetchedAt).getTime();
    if (Number.isNaN(t)) { eligible = false; reasons.push('invalid timestamp'); }
    else if (t > now.getTime() + FUTURE_SKEW_MS) { eligible = false; reasons.push('future timestamp'); }
    else if (now.getTime() - t > opts.maxAgeMs) { eligible = false; reasons.push('stale quote'); }
    if (offer.stock===null||!Number.isSafeInteger(offer.stock)||offer.stock<0){eligible=false;reasons.push('warehouse-ready stock unknown')}
    else if(offer.stock===0){eligible=false;reasons.push('out of stock')}
    else if(offer.stock<quantity){eligible=false;reasons.push('insufficient exact-origin stock')}
    if(offer.quoteQuantity!==undefined&&offer.quoteQuantity!==quantity){eligible=false;reasons.push('different freight quantity')} 
    if (offer.currency !== currency) { eligible = false; reasons.push(`currency ${offer.currency} not comparable`); }
    if (offer.shippingCents === undefined) { eligible = false; reasons.push('shipping unknown - total not comparable'); }
    if (eligible) reasons.push('eligible');
    return { offer, eligible, reasons };
  });

  const pool = considered.filter((c) => c.eligible).map((c) => c.offer);
  pool.sort((a, b) => {
    const ta = a.priceCents*quantity + (a.shippingCents as number);
    const tb = b.priceCents*quantity + (b.shippingCents as number);
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

  const excludedUnknowns = considered
    .filter((c) => !c.eligible)
    .map((c) => `${c.offer.provider}/${c.offer.providerSku}: ${c.reasons.join(', ')}`);
  const notes = [
    'Totals are supplier item + shipping quotes only - not landed cost. Duty and tax are unknown and not included.',
  ];
  if (excludedUnknowns.length) notes.push(`Excluded offers: ${excludedUnknowns.join('; ')}`);
  if (!pool.length) notes.push('No qualified offer: nothing comparable under the freshness, stock, currency and quote-coverage rules.');

  return { selected: pool[0] ?? null, considered, notes };
}
