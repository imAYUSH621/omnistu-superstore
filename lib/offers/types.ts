/**
 * Provider-neutral offer model (design slice: no provider is wired up).
 *
 * An Offer is one supplier's sellable quote for one normalized variant of a
 * catalog product. Variant identity is explicit (variantKey), never fuzzy
 * merged: two offers are the same variant only when they share a variantKey
 * produced by the catalog's own normalization, not by name similarity.
 *
 * Provenance is mandatory: every offer carries where and when its price/stock
 * was read (provider, providerSku, fetchedAt). UI and assistants may quote an
 * offer only with that provenance, and never as a "best product" guarantee.
 */
export interface Offer {
  provider: string;        // e.g. 'cj', 'aliexpress-skeleton'
  providerSku: string;     // supplier's own SKU/variant id
  variantKey: string;      // normalized variant identity (catalog-owned)
  priceCents: number;      // supplier item price, integer cents
  currency: 'USD';
  stock: number | null;    // exact-origin warehouse-ready snapshot, null if unestablished
  supplierReportedStock?: number | null; // factory+warehouse report, not ready stock
  originCountry?: string; // exact stock origin, required by preparation pipeline
  fetchedAt: Date;         // when this quote was read from the provider
  quoteQuantity?:number; // exact freight quantity, if attached by evidence pipeline
  shippingCents?: number;  // supplier shipping if known; else undefined
}

export interface OfferDecision {
  selected: Offer | null;
  considered: Array<{
    offer: Offer;
    eligible: boolean;
    reasons: string[];     // why excluded, or 'eligible'
  }>;
  notes: string[];         // coverage caveats: not landed cost, excluded unknowns
}
