'use client';

import { useEffect, useState } from 'react';
import { convertPrice } from '@/lib/i18n';
import { ratesDisclosure } from '@/lib/rates-disclosure';

export const SUPPORTED_CURRENCY_CODES = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const;
export type DisplayCurrency = (typeof SUPPORTED_CURRENCY_CODES)[number];

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function readCurrencyPreference(): DisplayCurrency {
  const v = (readCookie('omnistu_currency') || localStorage.getItem('omnistu_currency') || '').toUpperCase();
  return (SUPPORTED_CURRENCY_CODES as readonly string[]).includes(v) ? (v as DisplayCurrency) : 'USD';
}

// Single-flight hourly-cached rates load; the /api/rates route itself
// reports its source (live_api / env_override / cache / default_safe), and
// that source decides the honesty wording shown to visitors.
export interface RatesInfo {
  rates: Record<string, number>;
  source: string | null;
}
let ratesPromise: Promise<RatesInfo | null> | null = null;
export function loadRatesInfo(): Promise<RatesInfo | null> {
  if (!ratesPromise) {
    ratesPromise = fetch('/api/rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        d && d.success && d.rates
          ? { rates: d.rates as Record<string, number>, source: (d.source as string) ?? null }
          : null
      )
      .catch(() => null);
  }
  return ratesPromise;
}

/**
 * Visitor-currency price display. SSR and first paint always render the
 * USD amount (identical markup, no hydration mismatch). After mount the
 * visitor's detected or manually chosen currency (omnistu_currency) is
 * applied using the hourly /api/rates feed, marked approximate. Cart,
 * checkout, orders and payment capture stay USD - display conversion is
 * reference-only and settlement is never converted.
 */
export default function LocalizedPrice({
  amountUsd,
  className = '',
  supClassName = '',
}: {
  amountUsd: number;
  className?: string;
  supClassName?: string;
}) {
  const safe = Math.max(0, Number.isFinite(amountUsd) ? amountUsd : 0);
  const [display, setDisplay] = useState<{ formatted: string; approx: boolean; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apply = async () => {
      const currency = readCurrencyPreference();
      if (currency === 'USD') {
        if (!cancelled) setDisplay(null);
        return;
      }
      const info = await loadRatesInfo();
      if (cancelled) return;
      const { formatted } = convertPrice(safe, currency, info?.rates ?? undefined);
      setDisplay({ formatted, approx: true, title: ratesDisclosure(info?.source).priceTitle });
    };
    apply();
    const onChange = () => apply();
    window.addEventListener('omnistu:currency-change', onChange);
    return () => {
      cancelled = true;
      window.removeEventListener('omnistu:currency-change', onChange);
    };
  }, [safe]);

  if (display) {
    return (
      <span className={className} title={display.title}>
        {display.formatted}
        <sup className={supClassName}>~</sup>
      </span>
    );
  }

  return (
    <span className={className}>
      <sup className={supClassName}>$</sup>
      {Math.floor(safe)}
      <sup className={supClassName}>{(safe % 1).toFixed(2).slice(2)}</sup>
    </span>
  );
}
