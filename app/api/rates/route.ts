import { NextResponse } from 'next/server';
import { fetchLiveExchangeRates } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const liveRates = await fetchLiveExchangeRates();
    return NextResponse.json(
      {
        success: true,
        base: liveRates.base,
        rates: liveRates.rates,
        source: liveRates.source,
        timestamp: liveRates.timestamp,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
