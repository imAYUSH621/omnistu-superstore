import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Terms from '@/app/(root)/terms/page';
import Shipping from '@/app/(root)/shipping-policy/page';
import Refunds from '@/app/(root)/refund-policy/page';

const pages = [Terms, Shipping, Refunds];

it.each(pages)('renders honest test-mode information without unapproved live promises', (Page) => {
  const html = renderToStaticMarkup(<Page />);
  expect(html).toContain('Test mode - no live purchases or dispatch');
  expect(html).not.toMatch(/100%|Zero-Risk|Risk-Free|automatic 100|24 to 48|7 calendar|Effective Date:|charged in USD|1–3 Business Days|USPS|Blue Dart/);
  expect(html).toContain('href="/contact"');
  expect(html).toContain('href="/privacy"');
});

it('states cost unknowns and no real activation, rather than declaring prices ready', () => {
  const html = renderToStaticMarkup(<Terms />);
  expect(html).toContain('Unknown handling, tax, duties, payment fees and return costs must not be treated as zero');
  expect(html).toContain('Test totals are for simulation only');
});

it('separates exact-route freight, processing and transit coverage', () => {
  const html = renderToStaticMarkup(<Shipping />);
  expect(html).toContain('Supplier processing time and transit time are separate');
  expect(html).toContain('one postal code does not establish delivery coverage elsewhere');
});

it('does not turn supplier dispute rules into a new customer policy', () => {
  const html = renderToStaticMarkup(<Refunds />);
  expect(html).toContain('No automatic approval promise');
  expect(html).toContain('still need to be confirmed for each product and destination');
});
