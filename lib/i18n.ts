/**
 * Global Internationalization (i18n) & Dynamic Multi-Currency Engine
 * Powers multi-language navigation and real-time localized currency formatting.
 * Dynamic rates fetched via exchange-rates.ts.
 */

import { getLiveRatesSync, fetchLiveExchangeRates } from './exchange-rates';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number; // against USD (1 USD = rate * Currency)
}

export const CURRENCY_METADATA: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
};

export function getCurrencyConfig(code: string): CurrencyConfig {
  const upper = (code || 'USD').toUpperCase();
  const meta = CURRENCY_METADATA[upper] || CURRENCY_METADATA.USD;
  const rates = getLiveRatesSync().rates;
  const rate = rates[upper] || rates.USD || 1.0;

  return {
    code: upper,
    symbol: meta.symbol,
    name: meta.name,
    rate,
  };
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (typeof prop === 'string' && CURRENCY_METADATA[prop.toUpperCase()]) {
        return getCurrencyConfig(prop);
      }
      return undefined;
    },
    ownKeys() {
      return Object.keys(CURRENCY_METADATA);
    },
    getOwnPropertyDescriptor(_target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: getCurrencyConfig(String(prop)),
      };
    },
  }
);

export interface LanguageConfig {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'EN', label: 'English', flag: '🇺🇸' },
  { code: 'HI', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ES', label: 'Español', flag: '🇪🇸' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'JA', label: '日本語', flag: '🇯🇵' },
];

export function convertPrice(amountUsd: number, targetCurrency = 'USD'): { amount: number; formatted: string } {
  const safeAmount = Math.max(0, Number.isFinite(amountUsd) ? amountUsd : 0);
  const cfg = getCurrencyConfig(targetCurrency);
  const converted = safeAmount * cfg.rate;

  let formatted: string;
  if (cfg.code === 'INR') {
    formatted = `${cfg.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  } else if (cfg.code === 'JPY') {
    formatted = `${cfg.symbol}${Math.round(converted).toLocaleString('ja-JP')}`;
  } else if (cfg.code === 'EUR') {
    formatted = `${converted.toFixed(2).replace('.', ',')} ${cfg.symbol}`;
  } else {
    formatted = `${cfg.symbol}${converted.toFixed(2)}`;
  }

  return {
    amount: Number(converted.toFixed(2)),
    formatted,
  };
}

export { fetchLiveExchangeRates };

export const DICTIONARY = {
  EN: {
    todaysDeals: "Today's Deals",
    techGadgets: 'Tech & Gadgets',
    jewelryWatches: 'Jewelry & Watches',
    gourmetFood: 'Gourmet & Indian Food',
    customApparel: 'Custom Apparel',
    returnsOrders: 'Returns & Orders',
    cart: 'Cart',
    deliverTo: 'Deliver to',
    searchPlaceholder: 'Search Omnistu Superstore...',
    trendingFinds: 'Trending Finds',
    customerService: 'Customer Service',
    trackOrder: 'Track Order',
  },
  HI: {
    todaysDeals: 'आज के डील्स',
    techGadgets: 'टेक और गैजेट्स',
    jewelryWatches: 'आभूषण और घड़ियाँ',
    gourmetFood: 'शाही भारतीय खाद्य',
    customApparel: 'कस्टम कपड़े',
    returnsOrders: 'वापसी और ऑर्डर',
    cart: 'कार्ट',
    deliverTo: 'डिलीवरी स्थान',
    searchPlaceholder: 'ओम्निस्टू सुपरस्टोर में खोजें...',
    trendingFinds: 'ट्रेंडिंग खोजें',
    customerService: 'ग्राहक सेवा',
    trackOrder: 'ऑर्डर ट्रैक करें',
  },
  ES: {
    todaysDeals: 'Ofertas del Día',
    techGadgets: 'Tecnología y Gadgets',
    jewelryWatches: 'Joyería y Relojes',
    gourmetFood: 'Comida Gourmet e India',
    customApparel: 'Ropa Personalizada',
    returnsOrders: 'Devoluciones y Pedidos',
    cart: 'Carrito',
    deliverTo: 'Entregar en',
    searchPlaceholder: 'Buscar en Omnistu Superstore...',
    trendingFinds: 'Tendencias',
    customerService: 'Atención al Cliente',
    trackOrder: 'Rastrear Pedido',
  },
  FR: {
    todaysDeals: 'Offres du Jour',
    techGadgets: 'Technologie et Gadgets',
    jewelryWatches: 'Bijoux et Montres',
    gourmetFood: 'Épicerie Fine et Indienne',
    customApparel: 'Vêtements Personnalisés',
    returnsOrders: 'Retours et Commandes',
    cart: 'Panier',
    deliverTo: 'Livrer à',
    searchPlaceholder: 'Rechercher sur Omnistu Superstore...',
    trendingFinds: 'Tendances',
    customerService: 'Service Client',
    trackOrder: 'Suivre la Commande',
  },
  DE: {
    todaysDeals: 'Heutige Angebote',
    techGadgets: 'Technik & Gadgets',
    jewelryWatches: 'Schmuck & Uhren',
    gourmetFood: 'Gourmet & Indische Spezialitäten',
    customApparel: 'Individuelle Mode',
    returnsOrders: 'Warenrücksendungen & Bestellungen',
    cart: 'Warenkorb',
    deliverTo: 'Liefern nach',
    searchPlaceholder: 'Omnistu Superstore durchsuchen...',
    trendingFinds: 'Angesagte Funde',
    customerService: 'Kundenservice',
    trackOrder: 'Bestellung verfolgen',
  },
  JA: {
    todaysDeals: '本日のセール',
    techGadgets: '家電・ガジェット',
    jewelryWatches: 'ジュエリー・時計',
    gourmetFood: 'グルメ・インド食品',
    customApparel: 'カスタムアパレル',
    returnsOrders: '返品・注文履歴',
    cart: 'カート',
    deliverTo: 'お届け先',
    searchPlaceholder: 'Omnistu スーパーストアで検索...',
    trendingFinds: '話題のアイテム',
    customerService: 'カスタマーサービス',
    trackOrder: '注文を追跡',
  },
} as const;

export type SupportedLang = keyof typeof DICTIONARY;
export type DictionaryKey = keyof (typeof DICTIONARY)['EN'];

export function translate(lang: string, key: DictionaryKey): string {
  const dict = (DICTIONARY as Record<string, Record<string, string>>)[lang];
  return dict?.[key] ?? DICTIONARY.EN[key];
}
