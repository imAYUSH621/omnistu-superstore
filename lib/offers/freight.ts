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
  originCountry?: string;
  fetchedAt: Date;
}

export interface FreightContext {
  method?:string;
  originCountry?:string;
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
    (!ctx.method||e.method===ctx.method) &&
    (!ctx.originCountry||(e.originCountry===ctx.originCountry)) &&
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
  const valid=Number.isFinite(now.getTime())&&Number.isFinite(opts.maxAgeMs)&&opts.maxAgeMs>0&&Number.isSafeInteger(ctx.quantity)&&ctx.quantity>0;
  return offers.map((offer) => {
    if(!valid||ctx.originCountry&&offer.originCountry!==ctx.originCountry)return {...offer,shippingCents:undefined,quoteQuantity:undefined};
    const match = evidence.find((e) => {
      if(!Number.isSafeInteger(e.shippingCents)||e.shippingCents<0)return false;
      if (!evidenceMatchesOffer(e, offer)) return false;
      if (!evidenceMatchesContext(e, ctx)) return false;
      const t = new Date(e.fetchedAt).getTime();
      if (Number.isNaN(t)) return false;
      if (t > now.getTime()) return false;
      if (now.getTime() - t > opts.maxAgeMs) return false;
      return true;
    });
    if (!match) return {...offer,shippingCents:undefined,quoteQuantity:undefined}; // never carry shipping from an unproven prior context
    return { ...offer, shippingCents: match.shippingCents,quoteQuantity:ctx.quantity };
  });
}

/**
 * Destination-scoped cached freight quote store.
 *
 * Quotes are read from JSON files in a cache directory. Every entry must be
 * labeled: 'live-cached' means it was once returned by the provider for the
 * exact pid/vid/quantity/destination/currency it names; 'simulated-fixture'
 * means it is synthetic test data. Simulated entries are excluded unless the
 * caller explicitly opts in, so a fixture can never silently qualify an offer
 * in a production path. Files named *.simulated.json may contain ONLY
 * simulated entries; any other file must contain ONLY live-cached entries.
 * Anything ambiguous is rejected (fail closed).
 */

export type FreightQuoteSource = 'live-cached' | 'simulated-fixture';

export interface StoredFreightEvidence extends FreightEvidence {
  source: FreightQuoteSource;
}

export interface FreightQuoteResult {
  offer: Offer;
  shippingCents: number;
  source: FreightQuoteSource; // always surfaced; callers must not present simulated as live
  method?: string;
  fetchedAt: Date;
}

function isValidStored(value: unknown): value is StoredFreightEvidence {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.provider === 'string' &&
    typeof e.pid === 'string' &&
    typeof e.quantity === 'number' && Number.isSafeInteger(e.quantity) && e.quantity > 0 &&
    typeof e.destinationCountry === 'string' &&
    typeof e.destinationPostal === 'string' &&
    e.currency === 'USD' &&
    typeof e.shippingCents === 'number' && Number.isSafeInteger(e.shippingCents) && e.shippingCents >= 0 &&
    (typeof e.fetchedAt === 'string' || e.fetchedAt instanceof Date) &&
    !Number.isNaN(new Date(e.fetchedAt).getTime()) &&
    (e.source === 'live-cached' || e.source === 'simulated-fixture')
  );
}

export function parseFreightEvidenceFile(
  fileName: string,
  json: unknown,
  opts: { includeSimulated?: boolean } = {}
): StoredFreightEvidence[] {
  const simulatedFile = fileName.endsWith('.simulated.json');
  const arr = Array.isArray(json) ? json : [json];
  const out: StoredFreightEvidence[] = [];
  for (const raw of arr) {
    if (!isValidStored(raw)) continue; // fail closed on malformed entries
    if (simulatedFile !== (raw.source === 'simulated-fixture')) continue; // label must match file convention
    if (raw.source === 'simulated-fixture' && !opts.includeSimulated) continue;
    out.push({ ...raw, fetchedAt: new Date(raw.fetchedAt) });
  }
  return out;
}

/**
 * Destination-scoped lookup: returns a quote only for evidence matching the
 * exact offer identity AND the exact quantity/destination/currency context,
 * within maxAgeMs. Otherwise null - the offer stays unrankable (unknown
 * shipping), never estimated.
 */
export function getCachedFreightQuote(
  offer: Offer,
  evidence: StoredFreightEvidence[],
  ctx: FreightContext,
  now: Date,
  opts: { maxAgeMs: number }
): FreightQuoteResult | null {
  const [withShipping] = applyFreightEvidence([offer], evidence, ctx, now, opts);
  if (withShipping.shippingCents === undefined) return null;
  const match = evidence.find(
    (e) =>
      evidenceMatchesOffer(e, offer) &&
      evidenceMatchesContext(e, ctx) &&
      new Date(e.fetchedAt).getTime() <= now.getTime() &&
      now.getTime() - new Date(e.fetchedAt).getTime() <= opts.maxAgeMs
  );
  if (!match) return null;
  return {
    offer: withShipping,
    shippingCents: withShipping.shippingCents,
    source: match.source,
    method: match.method,
    fetchedAt: new Date(match.fetchedAt),
  };
}
