import { describe, expect, test } from '@jest/globals';
import { applyFreightEvidence, FreightEvidence } from '../lib/offers/freight';
import { applyMapping, validateMapping } from '../lib/offers/mapping';
import { cjCachedOffers } from '../lib/offers/cj';
import { selectOffer } from '../lib/offers/select';
import { Offer } from '../lib/offers/types';

const NOW = new Date('2026-11-03T05:00:00Z');
const item = {
  pid: 'P1',
  stockFetchedAt: '2026-11-03T04:30:00Z',
  variants: [
    { vid: 'V1', sku: 'SKU-US', cost: 27.9, stockRaw: { inventory: [{ totalInventory: 100 }] } },
    { vid: 'V2', sku: 'SKU-EU', cost: 26.5, stockRaw: { inventory: [{ totalInventory: 50 }] } },
  ],
};
const offers = cjCachedOffers(item);
const ctx = { quantity: 1, destinationCountry: 'IN', destinationPostal: '800001', currency: 'USD' as const };
const ev = (over: Partial<FreightEvidence>): FreightEvidence => ({
  provider: 'cj', pid: 'P1', vid: 'V1', quantity: 1,
  destinationCountry: 'IN', destinationPostal: '800001', currency: 'USD',
  shippingCents: 500, fetchedAt: new Date('2026-11-03T04:00:00Z'), ...over,
});

describe('cached freight evidence attaches only on exact context match', () => {
  test('exact pid/vid/quantity/destination/currency + fresh quote attaches shipping', () => {
    const out = applyFreightEvidence(offers, [ev({})], ctx, NOW, { maxAgeMs: 86_400_000 });
    expect(out.find((o) => o.variantKey === 'cj|P1|V1')?.shippingCents).toBe(500);
    expect(out.find((o) => o.variantKey === 'cj|P1|V2')?.shippingCents).toBeUndefined();
  });

  test('assumed destination does not qualify a different real destination', () => {
    const assumed = ev({ destinationCountry: 'US', destinationPostal: '10001' }); // Nov1 cached evidence shape
    const out = applyFreightEvidence(offers, [assumed], ctx, NOW, { maxAgeMs: 86_400_000 });
    expect(out.every((o) => o.shippingCents === undefined)).toBe(true);
    const d = selectOffer(out, NOW, { maxAgeMs: 3600_000 });
    expect(d.selected).toBeNull();
    expect(d.notes.join(' ')).toMatch(/No qualified offer/);
  });

  test('wrong quantity, currency or variant does not attach', () => {
    expect(applyFreightEvidence(offers, [ev({ quantity: 5 })], ctx, NOW, { maxAgeMs: 86_400_000 })[0].shippingCents).toBeUndefined();
    expect(applyFreightEvidence(offers, [ev({ vid: 'V9' })], ctx, NOW, { maxAgeMs: 86_400_000 })[0].shippingCents).toBeUndefined();
    const eur = ev({ currency: 'EUR' as FreightEvidence['currency'] });
    expect(applyFreightEvidence(offers, [eur], ctx, NOW, { maxAgeMs: 86_400_000 })[0].shippingCents).toBeUndefined();
  });

  test('stale or future evidence is ignored', () => {
    const stale = ev({ fetchedAt: new Date('2026-10-25T04:00:00Z') });
    expect(applyFreightEvidence(offers, [stale], ctx, NOW, { maxAgeMs: 86_400_000 })[0].shippingCents).toBeUndefined();
    const future = ev({ fetchedAt: new Date('2026-11-04T04:00:00Z') });
    expect(applyFreightEvidence(offers, [future], ctx, NOW, { maxAgeMs: 86_400_000 })[0].shippingCents).toBeUndefined();
  });

  test('with matching freight, the selector ranks by comparable total', () => {
    const out = applyFreightEvidence(offers, [ev({}), ev({ vid: 'V2', shippingCents: 900 })], ctx, NOW, { maxAgeMs: 86_400_000 });
    const d = selectOffer(out, NOW, { maxAgeMs: 3600_000 });
    // V1: 2790+500=3290, V2: 2650+900=3550 -> V1 wins despite higher item price
    expect(d.selected?.variantKey).toBe('cj|P1|V1');
    expect(d.notes.join(' ')).toMatch(/not landed cost/i);
  });
});

describe('explicit cross-provider variant mapping', () => {
  const mkOffer = (over: Partial<Offer>): Offer => ({
    provider: 'cj', providerSku: 'SKU-US', variantKey: 'cj|P1|V1',
    priceCents: 2790, currency: 'USD', stock: 10,
    fetchedAt: new Date('2026-11-03T04:30:00Z'), shippingCents: 500, ...over,
  });

  test('owner-confirmed mapping unifies members under the canonical key', () => {
    const mappings = [{
      canonicalVariantKey: 'cw15|us-plug',
      members: [
        { provider: 'cj', providerProductId: 'P1', providerVariantId: 'V1' },
        { provider: 'ae', providerProductId: 'A9', providerVariantId: 'X2' },
      ],
      confirmedBy: 'owner' as const,
      confirmedAt: '2026-11-03T01:00:00Z',
    }];
    expect(validateMapping(mappings[0])).toEqual([]);
    const out = applyMapping([
      mkOffer({}),
      mkOffer({ provider: 'ae', providerSku: 'X2', variantKey: 'ae|A9|X2', priceCents: 2900 }),
      mkOffer({ provider: 'ae', providerSku: 'OTHER', variantKey: 'ae|A9|OTHER' }),
    ], mappings);
    expect(out[0].variantKey).toBe('cw15|us-plug');
    expect(out[1].variantKey).toBe('cw15|us-plug');
    expect(out[2].variantKey).toBe('ae|A9|OTHER'); // unmapped rows untouched
  });

  test('invalid mappings are rejected and never guessed', () => {
    expect(validateMapping({ canonicalVariantKey: '', members: [], confirmedBy: 'owner', confirmedAt: '2026-11-03T01:00:00Z' })).toContain('canonicalVariantKey required');
    expect(validateMapping({ canonicalVariantKey: 'k', members: [
      { provider: 'cj', providerProductId: 'P1', providerVariantId: 'V1' },
      { provider: 'cj', providerProductId: 'P1', providerVariantId: 'V1' },
    ], confirmedBy: 'owner', confirmedAt: '2026-11-03T01:00:00Z' })).toContain('duplicate member cj|P1|V1');
    expect(validateMapping({ canonicalVariantKey: 'k', members: [
      { provider: 'cj', providerProductId: 'P1', providerVariantId: 'V1' },
      { provider: 'ae', providerProductId: 'A9', providerVariantId: 'X2' },
    ], confirmedBy: 'import' as never, confirmedAt: '2026-11-03T01:00:00Z' })).toContain('mapping must be owner-confirmed');
  });
});
