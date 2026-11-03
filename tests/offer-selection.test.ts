import { describe, expect, test } from '@jest/globals';
import { selectOffer } from '../lib/offers/select';
import { Offer } from '../lib/offers/types';

const NOW = new Date('2026-11-03T05:00:00Z');
const base: Offer = {
  provider: 'cj', providerSku: 'SKU-1', variantKey: 'cw15|default',
  priceCents: 1000, currency: 'USD', stock: 5,
  fetchedAt: new Date('2026-11-03T04:30:00Z'),
};
const mk = (over: Partial<Offer>): Offer => ({ ...base, ...over });

describe('deterministic multi-provider offer selection', () => {
  test('lowest total (price + shipping) wins among eligible offers', () => {
    const cheap = mk({ providerSku: 'A', priceCents: 900, shippingCents: 200 });
    const cheaperTotal = mk({ provider: 'ae', providerSku: 'B', priceCents: 950, shippingCents: 100 });
    const d = selectOffer([cheap, cheaperTotal], NOW, { maxAgeMs: 3600_000 });
    expect(d.selected?.providerSku).toBe('B');
  });

  test('stale quotes are excluded with provenance reason', () => {
    const stale = mk({ providerSku: 'OLD', priceCents: 100, fetchedAt: new Date('2026-11-02T01:00:00Z') });
    const d = selectOffer([stale, base], NOW, { maxAgeMs: 3600_000 });
    expect(d.selected?.providerSku).toBe('SKU-1');
    expect(d.considered.find((c) => c.offer.providerSku === 'OLD')?.reasons).toContain('stale quote');
  });

  test('zero-stock offers never win, even when cheapest', () => {
    const empty = mk({ providerSku: 'EMPTY', priceCents: 1, stock: 0 });
    const d = selectOffer([empty, base], NOW, { maxAgeMs: 3600_000 });
    expect(d.selected?.providerSku).toBe('SKU-1');
    expect(d.considered.find((c) => c.offer.providerSku === 'EMPTY')?.eligible).toBe(false);
  });

  test('equal totals pick the fresher quote', () => {
    const fresher = mk({ provider: 'ae', providerSku: 'F', fetchedAt: new Date('2026-11-03T04:59:00Z') });
    const d = selectOffer([base, fresher], NOW, { maxAgeMs: 3600_000 });
    expect(d.selected?.providerSku).toBe('F');
  });

  test('provider priority only breaks exact price+freshness ties', () => {
    const a = mk({ provider: 'cj', providerSku: 'X' });
    const b = mk({ provider: 'ae', providerSku: 'Y' });
    const d = selectOffer([b, a], NOW, { maxAgeMs: 3600_000, providerPriority: ['ae', 'cj'] });
    expect(d.selected?.provider).toBe('ae');
  });

  test('final tiebreak is fully deterministic regardless of input order', () => {
    const a = mk({ provider: 'ae', providerSku: 'Y' });
    const b = mk({ provider: 'cj', providerSku: 'X' });
    const d1 = selectOffer([a, b], NOW, { maxAgeMs: 3600_000 });
    const d2 = selectOffer([b, a], NOW, { maxAgeMs: 3600_000 });
    expect(d1.selected?.providerSku).toBe(d2.selected?.providerSku);
  });

  test('no eligible offer returns null with every exclusion explained', () => {
    const d = selectOffer([mk({ stock: 0 })], NOW, { maxAgeMs: 3600_000 });
    expect(d.selected).toBeNull();
    expect(d.considered[0].reasons).toContain('out of stock');
  });

  test('selection never mutates the input offers', () => {
    const offers = [mk({ providerSku: 'Z' }), mk({ providerSku: 'A', priceCents: 1 })];
    selectOffer(offers, NOW, { maxAgeMs: 3600_000 });
    expect(offers[0].providerSku).toBe('Z');
  });

  test('variant identity is explicit: different variantKeys are never merged', () => {
    const other = mk({ providerSku: 'V2', variantKey: 'cw15|color:black', priceCents: 1 });
    const d = selectOffer([base, other], NOW, { maxAgeMs: 3600_000 });
    // both stay separate rows; selection is over the set it is given
    expect(d.considered).toHaveLength(2);
    expect(new Set(d.considered.map((c) => c.offer.variantKey)).size).toBe(2);
  });
});
