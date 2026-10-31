import fs from 'fs';
import path from 'path';
import { quoteShipping, convertUsdToInr, formatInr, formatUsd, getUsdToInrRate } from '../lib/shipping';
import { priceForDestination } from '../lib/pricing';

describe('Indian Food Catalog & India Shipping Integration', () => {
  const catalogPath = path.join(process.cwd(), 'public', 'data', 'catalog_unified.json');

  it('contains authentic Gourmet & Indian Food items in catalog_unified.json', () => {
    expect(fs.existsSync(catalogPath)).toBe(true);
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    const items = Object.values(catalog) as Array<{ title?: string; category?: string; price?: string; asin?: string }>;

    const indianFoodItems = items.filter(
      (it) => it.category === 'Gourmet & Indian Food' || (it.title && /saffron|chai|basmati|ghee|spices/i.test(it.title))
    );

    expect(indianFoodItems.length).toBeGreaterThanOrEqual(8);

    // Verify key iconic items exist
    const saffron = indianFoodItems.find((it) => it.title?.toLowerCase().includes('saffron'));
    expect(saffron).toBeDefined();
    expect(saffron?.price).toBe('$24.99');

    const chai = indianFoodItems.find((it) => it.title?.toLowerCase().includes('masala chai'));
    expect(chai).toBeDefined();

    const ghee = indianFoodItems.find((it) => it.title?.toLowerCase().includes('ghee'));
    expect(ghee).toBeDefined();
  });

  describe('quoteShipping logic', () => {
    it('quotes standard shipping for India destination with correct carrier and timeline', () => {
      const quote = quoteShipping('IN', 'standard', 0.5);
      expect(quote.destinationCountry).toBe('IN');
      expect(quote.serviceLevel).toBe('standard');
      expect(quote.shippingCostUsd).toBe(6.5);
      expect(quote.carrier).toContain('CJ Packet Fast');
      expect(quote.customsInclusive).toBe(true);
      expect(quote.shippingCostInr).toBeGreaterThan(500);
    });

    it('quotes express shipping for India destination with DHL/Blue Dart', () => {
      const quote = quoteShipping('IN', 'express', 1.5);
      expect(quote.destinationCountry).toBe('IN');
      expect(quote.serviceLevel).toBe('express');
      expect(quote.shippingCostUsd).toBe(14.99);
      expect(quote.carrier).toContain('DHL Express');
    });

    it('handles domestic US shipping correctly', () => {
      const quote = quoteShipping('US', 'standard', 0.5);
      expect(quote.shippingCostUsd).toBe(4.0);
      expect(quote.carrier).toContain('USPS');

      const expressQuote = quoteShipping('US', 'express', 0.5);
      expect(expressQuote.shippingCostUsd).toBe(9.99);
    });

    it('handles international Rest of World shipping correctly', () => {
      const rowQuote = quoteShipping('GB', 'standard', 1.5);
      expect(rowQuote.destinationCountry).toBe('GB');
      expect(rowQuote.shippingCostUsd).toBeGreaterThan(8.5);
      expect(rowQuote.carrier).toContain('Postal');

      const rowExpress = quoteShipping('DE', 'express', 1.5);
      expect(rowExpress.shippingCostUsd).toBeGreaterThan(16.99);
      expect(rowExpress.carrier).toContain('FedEx');
    });

    it('handles case insensitivity and whitespace in country codes', () => {
      const quote = quoteShipping('  in  ', 'standard');
      expect(quote.destinationCountry).toBe('IN');
    });
  });

  describe('Currency conversion and formatting', () => {
    it('converts USD to INR using configured exchange rate', () => {
      const rate = getUsdToInrRate();
      expect(rate).toBeGreaterThan(70);
      const inr = convertUsdToInr(10, rate);
      expect(inr).toBe(Math.round(10 * rate));
    });

    it('formats INR and USD cleanly', () => {
      expect(formatInr(2160)).toBe('₹2,160');
      expect(formatUsd(24.99)).toBe('$24.99');
    });
  });

  describe('priceForDestination end-to-end integration', () => {
    it('calculates retail price, India shipping, margin, and INR conversion accurately', () => {
      // Saffron wholesale $8.00 with standard India shipping ($6.50)
      const result = priceForDestination(8.0, 'IN', 'standard');
      expect(result.retailPrice).toBeGreaterThan(20);
      expect(result.marginPct).toBeGreaterThanOrEqual(30);
      expect(result.shippingQuote.destinationCountry).toBe('IN');
      expect(result.inrPrice).toBeGreaterThan(1500);
    });
  });
});
