import { assessLandedCost } from '@/lib/landed-cost';
const costs = { product: 1000, freight: 0, handling: 0, sellerTaxDuty: 0, returnLossReserve: 0 };
const fees = { percent: 3, fixedCents: 30 };
it('does not convert missing fees/tax/handling into a complete cost or price', () => {
  const r = assessLandedCost({ ...costs, handling: null, sellerTaxDuty: null }, { percent: null, fixedCents: null }, 30);
  expect(r).toMatchObject({ status: 'incomplete', knownSubtotalCents: 1000, landedCostCents: null, scenario: null });
  expect(r.missing).toEqual(['handling', 'sellerTaxDuty', 'paymentFeePercent', 'paymentFeeFixed']);
});
it('supports explicit verified zero freight without assuming other costs zero', () => {
  expect(assessLandedCost(costs, fees, 30).status).toBe('costed-scenario');
  expect(assessLandedCost({ ...costs, returnLossReserve: null }, fees, 30).scenario).toBeNull();
});
it.each([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects unsafe monetary inputs %s', (product) => {
  expect(() => assessLandedCost({ ...costs, product }, fees, 30)).toThrow();
});
it('refuses unsafe summed cents and impossible margin+fees', () => {
  expect(() => assessLandedCost({ ...costs, product: Number.MAX_SAFE_INTEGER, freight: 1 }, fees, 30)).toThrow();
  expect(() => assessLandedCost(costs, { percent: 50, fixedCents: 0 }, 50)).toThrow();
});
it('distinguishes margin on revenue from doubling the cost', () => {
  const r = assessLandedCost(costs, { percent: 0, fixedCents: 0 }, 50);
  expect(r.scenario!.retailPrice).toBeGreaterThanOrEqual(20);
  expect(r.scenario!.marginPct).toBeGreaterThanOrEqual(50);
});
