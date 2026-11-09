/**
 * Visitor-facing wording for the currency display, keyed to the actual
 * source /api/rates reported. Never claim "provider rates" when the feed
 * fell back to the bundled default table or an env override.
 */
export type RatesSource = 'live_api' | 'env_override' | 'cache' | 'default_safe';

export interface RatesDisclosure {
  /** True when the numbers come from the daily provider feed (or its cache). */
  live: boolean;
  /** Short clause used inside the selector disclosure sentence. */
  ratesClause: string;
  /** Tooltip for converted prices. */
  priceTitle: string;
  /** Plain-text note shown or read at the point of price (touch and screen readers). */
  noteText: string;
}

export function ratesDisclosure(source: RatesSource | string | null | undefined): RatesDisclosure {
  const live = source === 'live_api' || source === 'cache';
  return {
    live,
    ratesClause: live ? 'daily provider rates (checked hourly)' : 'reference rates - live rates temporarily unavailable',
    noteText: live
      ? 'Approximate price at daily provider rates (checked hourly). You are charged in USD at checkout.'
      : 'Approximate price at reference rates (live rates temporarily unavailable). You are charged in USD at checkout.',
    priceTitle: live
      ? 'Approximate conversion at daily provider rates (checked hourly) - checkout charges USD'
      : 'Approximate conversion at reference rates (live rates temporarily unavailable) - checkout charges USD',
  };
}
