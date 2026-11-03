import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getCachedFreightQuote,
  parseFreightEvidenceFile,
  StoredFreightEvidence,
} from '../lib/offers/freight';
import { cjCachedOffers } from '../lib/offers/cj';
import { selectOffer } from '../lib/offers/select';

const NOW = new Date('2026-11-03T05:00:00Z');
const item = {
  pid: 'P1',
  stockFetchedAt: '2026-11-03T04:30:00Z',
  variants: [
    { vid: 'V1', sku: 'SKU-US', cost: 27.9, stockRaw: { inventory: [{ totalInventory: 100 }] } },
  ],
};
const [offer] = cjCachedOffers(item);
const simCtx = { quantity: 1, destinationCountry: 'SIM', destinationPostal: 'SIM-000', currency: 'USD' as const };

const loadSimulated = (includeSimulated: boolean): StoredFreightEvidence[] =>
  parseFreightEvidenceFile(
    'quotes.simulated.json',
    JSON.parse(readFileSync(join(__dirname, 'fixtures/freight/quotes.simulated.json'), 'utf8')),
    { includeSimulated }
  );

describe('destination-scoped cached freight quote store', () => {
  test('labeled simulated fixture is excluded by default (fail closed)', () => {
    const ev = loadSimulated(false);
    expect(ev).toHaveLength(0);
    expect(getCachedFreightQuote(offer, ev, simCtx, NOW, { maxAgeMs: 86_400_000 })).toBeNull();
    const d = selectOffer([offer], NOW, { maxAgeMs: 3_600_000 });
    expect(d.selected).toBeNull();
    expect(d.notes.join(' ')).toMatch(/No qualified offer/);
  });

  test('simulated fixture matches only its exact synthetic destination when opted in', () => {
    const ev = loadSimulated(true);
    expect(ev).toHaveLength(1);
    const hit = getCachedFreightQuote(offer, ev, simCtx, NOW, { maxAgeMs: 86_400_000 });
    expect(hit?.shippingCents).toBe(499);
    expect(hit?.source).toBe('simulated-fixture'); // provenance travels with the quote
    // a different, real-looking destination gets nothing
    const realCtx = { quantity: 1, destinationCountry: 'US', destinationPostal: '10001', currency: 'USD' as const };
    expect(getCachedFreightQuote(offer, ev, realCtx, NOW, { maxAgeMs: 86_400_000 })).toBeNull();
  });

  test('stale, future, malformed and mislabeled entries are rejected', () => {
    const base = JSON.parse(readFileSync(join(__dirname, 'fixtures/freight/quotes.simulated.json'), 'utf8'))[0];
    const stale = { ...base, fetchedAt: '2026-10-01T00:00:00Z' };
    const future = { ...base, fetchedAt: '2027-01-01T00:00:00Z' };
    const malformed = { ...base, shippingCents: '499' };
    const evStale = parseFreightEvidenceFile('quotes.simulated.json', [stale], { includeSimulated: true });
    expect(getCachedFreightQuote(offer, evStale, simCtx, NOW, { maxAgeMs: 86_400_000 })).toBeNull();
    const evFuture = parseFreightEvidenceFile('quotes.simulated.json', [future], { includeSimulated: true });
    expect(getCachedFreightQuote(offer, evFuture, simCtx, NOW, { maxAgeMs: 86_400_000 })).toBeNull();
    expect(parseFreightEvidenceFile('quotes.simulated.json', [malformed], { includeSimulated: true })).toHaveLength(0);
    // mislabeled: simulated content in a non-simulated file name is dropped
    expect(parseFreightEvidenceFile('quotes.json', [base], { includeSimulated: true })).toHaveLength(0);
    // and live-cached content in a simulated file name is dropped
    const liveInSimFile = { ...base, source: 'live-cached' };
    expect(parseFreightEvidenceFile('quotes.simulated.json', [liveInSimFile], { includeSimulated: true })).toHaveLength(0);
  });

  test('live-cached entry attaches with source label and respects context', () => {
    const live = {
      ...JSON.parse(readFileSync(join(__dirname, 'fixtures/freight/quotes.simulated.json'), 'utf8'))[0],
      source: 'live-cached',
    };
    const ev = parseFreightEvidenceFile('cj-freight-quote.json', [live]);
    expect(ev).toHaveLength(1);
    const hit = getCachedFreightQuote(offer, ev, simCtx, NOW, { maxAgeMs: 86_400_000 });
    expect(hit?.source).toBe('live-cached');
    // wrong quantity: fail closed
    expect(
      getCachedFreightQuote(offer, ev, { ...simCtx, quantity: 2 }, NOW, { maxAgeMs: 86_400_000 })
    ).toBeNull();
  });
});
