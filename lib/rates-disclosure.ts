/**
 * Visitor-facing wording for the currency display, keyed to the actual
 * source /api/rates reported. Never claim "hourly rates" when the feed
 * fell back to the bundled default table or an env override.
 */
export type RatesSource = 'live_api' | 'env_override' | 'cache' | 'default_safe';

export interface RatesDisclosure {
  /** True when the numbers come from the live hourly feed (or its cache). */
  live: boolean;
  /** Short clause used inside the selector disclosure sentence. */
  ratesClause: string;
  /** Tooltip for converted prices. */
  priceTitle: string;
}

export function ratesDisclosure(source: RatesSource | string | null | undefined): RatesDisclosure {
  const live = source === 'live_api' || source === 'cache';
  return {
    live,
    ratesClause: live ? 'hourly live rates' : 'reference rates - live rates temporarily unavailable',
    priceTitle: live
      ? 'Approximate conversion at hourly live rates - checkout charges USD'
      : 'Approximate conversion at reference rates (live rates temporarily unavailable) - checkout charges USD',
  };
}
