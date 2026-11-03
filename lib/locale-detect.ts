/**
 * Automatic visitor locale & currency detection.
 *
 * Pure mapping helpers used by middleware.ts (first-visit cookie seeding)
 * and unit tests. Detection is a best-effort initial default ONLY:
 * existing omnistu_lang / omnistu_currency cookies always win (manual
 * override or a previous detection), and unknown / VPN / unmapped signals
 * fall back to EN + USD. Settlement stays USD regardless of display.
 */

export type SupportedLangCode = 'EN' | 'HI' | 'ES' | 'FR' | 'DE' | 'JA';
export type SupportedCurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

const SUBTAG_TO_LANG: Record<string, SupportedLangCode> = {
  en: 'EN',
  hi: 'HI',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  ja: 'JA',
};

// Display-currency hints from the deployment geo signal. Display only -
// checkout settles in USD for every visitor.
const EUROZONE = new Set(['ES', 'FR', 'DE', 'IT', 'NL', 'PT', 'IE', 'AT', 'BE', 'FI', 'GR', 'LU', 'SI', 'SK', 'EE', 'LV', 'LT', 'CY', 'MT']);
const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrencyCode> = {
  US: 'USD',
  IN: 'INR',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  JP: 'JPY',
};

/**
 * Parse an Accept-Language header into an ordered list of language subtags,
 * highest q-value first. Returns [] for missing/malformed headers.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag.split('-')[0]);
}

/**
 * Pick the site language from the browser's Accept-Language header.
 * Browser language is a better language signal than geography (a Spanish
 * speaker in the US still gets ES). Falls back to EN.
 */
export function detectLanguage(acceptLanguage: string | null | undefined): SupportedLangCode {
  for (const subtag of parseAcceptLanguage(acceptLanguage)) {
    const lang = SUBTAG_TO_LANG[subtag];
    if (lang) return lang;
  }
  return 'EN';
}

/**
 * Pick the display currency from the deployment's geo country code
 * (x-vercel-ip-country on Vercel). Geo is the better currency signal.
 * Unknown / missing / unmapped countries (including most VPN exits)
 * fall back to USD, which is also the settlement currency.
 */
export function detectCurrency(country: string | null | undefined): SupportedCurrencyCode {
  const cc = (country || '').trim().toUpperCase();
  if (!cc) return 'USD';
  if (COUNTRY_TO_CURRENCY[cc]) return COUNTRY_TO_CURRENCY[cc];
  if (EUROZONE.has(cc)) return 'EUR';
  return 'USD';
}

export interface LocaleDetection {
  lang: SupportedLangCode;
  currency: SupportedCurrencyCode;
}

/** Full first-visit default from the two trusted request signals. */
export function detectLocale(country: string | null | undefined, acceptLanguage: string | null | undefined): LocaleDetection {
  return {
    lang: detectLanguage(acceptLanguage),
    currency: detectCurrency(country),
  };
}
