import { describe, expect, test } from '@jest/globals';
import { selectOffer } from '../lib/offers/select';
import { Offer } from '../lib/offers/types';

const NOW = new Date('2026-11-03T05:00:00Z');
const base: Offer = {
  provider: 'cj', providerSku: 'SKU-1', variantKey: 'cw15|default',
  priceCents: 1000, currency: 'USD', stock: 5,
  fetchedAt: new Date('2026-11-03T04:30:00Z'), shippingCents: 200,
};
const mk = (over: Partial<Offer>): Offer => ({ ...base, ...over });
const OPTS = { maxAgeMs: 3600_000 };

describe('deterministic multi-provider offer selection (landed-cost safe)', () => {
  test('lowest comparable total (price + known shipping) wins', () => {
    const cheap = mk({ providerSku: 'A', priceCents: 900, shippingCents: 200 });
    const cheaperTotal = mk({ provider: 'ae', providerSku: 'B', priceCents: 950, shippingCents: 100 });
    const d = selectOffer([cheap, cheaperTotal], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('B');
  });

  test('unknown shipping makes an offer not comparable - never counted as 0', () => {
    const unknownShip = mk({ providerSku: 'USHIP', priceCents: 1, shippingCents: undefined });
    const d = selectOffer([unknownShip, base], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('SKU-1');
    expect(d.considered.find((c) => c.offer.providerSku === 'USHIP')?.reasons).toContain('shipping unknown - total not comparable');
  });

  test('mixed currencies are not compared', () => {
    const eur = mk({ providerSku: 'EUR1', priceCents: 1, currency: 'EUR' as Offer['currency'] });
    const d = selectOffer([eur, base], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('SKU-1');
    expect(d.considered.find((c) => c.offer.providerSku === 'EUR1')?.eligible).toBe(false);
  });

  test('invalid timestamp is excluded, never trusted', () => {
    const bad = mk({ providerSku: 'BAD', fetchedAt: new Date('not-a-date') });
    const d = selectOffer([bad, base], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('SKU-1');
    expect(d.considered.find((c) => c.offer.providerSku === 'BAD')?.reasons).toContain('invalid timestamp');
  });

  test('future timestamps beyond skew are excluded', () => {
    const future = mk({ providerSku: 'FUT', fetchedAt: new Date('2026-11-03T06:00:00Z') });
    const d = selectOffer([future, base], NOW, OPTS);
    expect(d.considered.find((c) => c.offer.providerSku === 'FUT')?.reasons).toContain('future timestamp');
    expect(d.selected?.providerSku).toBe('SKU-1');
  });

  test('stale quotes are excluded with reason', () => {
    const stale = mk({ providerSku: 'OLD', priceCents: 100, fetchedAt: new Date('2026-11-02T01:00:00Z') });
    const d = selectOffer([stale, base], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('SKU-1');
    expect(d.considered.find((c) => c.offer.providerSku === 'OLD')?.reasons).toContain('stale quote');
  });

  test('zero-stock offers never win, even when cheapest', () => {
    const empty = mk({ providerSku: 'EMPTY', priceCents: 1, stock: 0 });
    const d = selectOffer([empty, base], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('SKU-1');
  });

  test('equal totals pick the fresher quote', () => {
    const fresher = mk({ provider: 'ae', providerSku: 'F', fetchedAt: new Date('2026-11-03T04:59:00Z') });
    const d = selectOffer([base, fresher], NOW, OPTS);
    expect(d.selected?.providerSku).toBe('F');
  });

  test('provider priority only breaks exact price+freshness ties', () => {
    const a = mk({ provider: 'cj', providerSku: 'X' });
    const b = mk({ provider: 'ae', providerSku: 'Y' });
    const d = selectOffer([b, a], NOW, { ...OPTS, providerPriority: ['ae', 'cj'] });
    expect(d.selected?.provider).toBe('ae');
  });

  test('final tiebreak is fully deterministic regardless of input order', () => {
    const a = mk({ provider: 'ae', providerSku: 'Y' });
    const b = mk({ provider: 'cj', providerSku: 'X' });
    const d1 = selectOffer([a, b], NOW, OPTS);
    const d2 = selectOffer([b, a], NOW, OPTS);
    expect(d1.selected?.providerSku).toBe(d2.selected?.providerSku);
  });

  test('no qualified offer: everything excluded, notes say so', () => {
    const d = selectOffer([mk({ stock: 0 }), mk({ providerSku: 'U', shippingCents: undefined })], NOW, OPTS);
    expect(d.selected).toBeNull();
    expect(d.notes.join(' ')).toMatch(/No qualified offer/);
  });

  test('notes always disclaim landed cost (duty and tax unknown, not zero)', () => {
    const d = selectOffer([base], NOW, OPTS);
    expect(d.notes.join(' ')).toMatch(/not landed cost/i);
    expect(d.notes.join(' ')).toMatch(/Duty and tax are unknown/);
  });

  test('variant identity is explicit: different variantKeys are never merged', () => {
    const other = mk({ providerSku: 'V2', variantKey: 'cw15|color:black', priceCents: 1 });
    const d = selectOffer([base, other], NOW, OPTS);
    expect(new Set(d.considered.map((c) => c.offer.variantKey)).size).toBe(2);
  });

  test('selection never mutates the input offers', () => {
    const offers = [mk({ providerSku: 'Z' }), mk({ providerSku: 'A', priceCents: 1 })];
    selectOffer(offers, NOW, OPTS);
    expect(offers[0].providerSku).toBe('Z');
  });
});
