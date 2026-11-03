import { describe, expect, test } from '@jest/globals';
import { cjCachedOffers, cjVariantKey } from '../lib/offers/cj';
import { selectOffer } from '../lib/offers/select';

const item = {
  pid: '2611010821021609200',
  stockFetchedAt: '2026-11-02T10:00:00Z',
  variants: [
    { vid: 'V1', sku: 'CW15-US', cost: 27.9, stockRaw: { inventory: [{ totalInventory: 8739 }] } },
    { vid: 'V2', sku: 'CW15-EU', cost: null, stockRaw: { inventory: [{ totalInventory: 12 }] } },
    { vid: 'V3', sku: 'CW15-UK', cost: 28.4, stockRaw: { inventory: [{ totalInventory: 3 }, { totalInventory: 4 }] } },
  ],
};

describe('CJ cached-offer adapter (no provider calls, no invented data)', () => {
  test('variant identity is deterministic pid|vid, namespaced to cj', () => {
    expect(cjVariantKey('P1', 'V1')).toBe('cj|P1|V1');
    expect(cjVariantKey('P1', 'V1')).toBe(cjVariantKey('P1', 'V1'));
  });

  test('variants without a cost quote produce no offer', () => {
    const offers = cjCachedOffers(item);
    expect(offers).toHaveLength(2);
    expect(offers.map((o) => o.providerSku).sort()).toEqual(['CW15-UK', 'CW15-US']);
  });

  test('stock is the summed supplier inventory snapshot, price in cents', () => {
    const offers = cjCachedOffers(item);
    expect(offers.find((o) => o.providerSku === 'CW15-US')?.stock).toBe(8739);
    expect(offers.find((o) => o.providerSku === 'CW15-UK')?.stock).toBe(7);
    expect(offers.find((o) => o.providerSku === 'CW15-US')?.priceCents).toBe(2790);
    expect(offers[0].currency).toBe('USD');
  });

  test('cached CJ offers carry no shipping, so the selector excludes them from ranking', () => {
    const offers = cjCachedOffers(item);
    const d = selectOffer(offers, new Date('2026-11-02T10:30:00Z'), { maxAgeMs: 3600_000 });
    expect(d.selected).toBeNull();
    expect(d.notes.join(' ')).toMatch(/No qualified offer/);
    expect(d.considered[0].reasons).toContain('shipping unknown - total not comparable');
  });
});
