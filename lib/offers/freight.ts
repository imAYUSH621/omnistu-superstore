import { Offer } from './types';

/**
 * Cached freight evidence, attached to offers only on EXACT context match.
 *
 * A freight quote is comparable only for the exact quantity, destination and
 * currency it was fetched for. Assumed or representative destinations (for
 * example a stand-in ZIP) are context too: they never qualify an offer for a
 * different real destination. Stale evidence is ignored. Anything unmatched
 * leaves shippingCents undefined, so the selector keeps excluding the offer
 * from ranking (fail closed, report unknowns).
 */

export interface FreightEvidence {
  provider: string;
  pid: string;                    // provider product id
  vid?: string;                   // provider variant id, when known
  variantSku?: string;            // provider variant SKU, when vid unknown
  quantity: number;
  destinationCountry: string;     // e.g. 'US'
  destinationPostal: string;      // e.g. '10001'
  currency: 'USD';
  shippingCents: number;
  method?: string;
  fetchedAt: Date;
}

export interface FreightContext {
  quantity: number;
  destinationCountry: string;
  destinationPostal: string;
  currency: 'USD';
}

function evidenceMatchesOffer(e: FreightEvidence, offer: Offer): boolean {
  if (e.provider !== offer.provider) return false;
  // variantKey shape for cj is `cj|${pid}|${vid}`
  const parts = offer.variantKey.split('|');
  const pid = parts[1];
  const vid = parts[2];
  if (e.pid !== pid) return false;
  if (e.vid) return e.vid === vid;
  if (e.variantSku) return e.variantSku === offer.providerSku;
  return false; // no variant identity in evidence -> cannot match
}

function evidenceMatchesContext(e: FreightEvidence, ctx: FreightContext): boolean {
  return (
    e.quantity === ctx.quantity &&
    e.destinationCountry === ctx.destinationCountry &&
    e.destinationPostal === ctx.destinationPostal &&
    e.currency === ctx.currency
  );
}

export function applyFreightEvidence(
  offers: Offer[],
  evidence: FreightEvidence[],
  ctx: FreightContext,
  now: Date,
  opts: { maxAgeMs: number }
): Offer[] {
  return offers.map((offer) => {
    const match = evidence.find((e) => {
      if (!evidenceMatchesOffer(e, offer)) return false;
      if (!evidenceMatchesContext(e, ctx)) return false;
      const t = new Date(e.fetchedAt).getTime();
      if (Number.isNaN(t)) return false;
      if (t > now.getTime()) return false;
      if (now.getTime() - t > opts.maxAgeMs) return false;
      return true;
    });
    if (!match) return offer; // unchanged: shipping stays unknown, excluded from ranking
    return { ...offer, shippingCents: match.shippingCents };
  });
}
