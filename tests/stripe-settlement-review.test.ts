const mockEvent = jest.fn();
const mockSettle = jest.fn();
const mockRecord = jest.fn();
const mockPaid = jest.fn();
const mockClaim = jest.fn();
jest.mock('stripe', () => ({ __esModule: true, default: { webhooks: { constructEvent: (...a: unknown[]) => mockEvent(...a) } } }));
jest.mock('@/lib/order-settlement', () => ({ updateOrderToPaid: (...a: unknown[]) => mockSettle(...a) }));
jest.mock('@/lib/captured-unsettled', () => ({ recordCapturedUnsettled: (...a: unknown[]) => mockRecord(...a) }));
jest.mock('@/db/prisma', () => ({ prisma: { order: { findFirst: (...a: unknown[]) => mockPaid(...a), updateMany: (...a: unknown[]) => mockClaim(...a) } } }));
import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
const request = () => new NextRequest('https://omnistu.test/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': 'test' }, body: '{}' });
const charge = { id: 'ch-test', currency: 'usd', amount: 500, billing_details: { email: 'buyer@example.test' }, metadata: { orderId: '11111111-1111-4111-8111-111111111111' } };
beforeEach(() => { jest.clearAllMocks(); mockEvent.mockReturnValue({ type: 'charge.succeeded', data: { object: charge } }); mockSettle.mockResolvedValue(undefined); mockPaid.mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111', isPaid: false, paymentNote: null }); mockClaim.mockResolvedValue({ count: 1 }); });
it('confirmed charge plus DB failure leaves review marker and generic response, no raw error', async () => {
  mockSettle.mockRejectedValue(Object.assign(new Error('postgres://secret internal-db'), { code: 'P2028' }));
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(mockRecord).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'ch-test', '5.00', expect.objectContaining({ code: 'P2028' }));
  expect(JSON.stringify(await response.json())).not.toMatch(/secret|internal-db/);
});
it('already-paid replay acknowledges without recording a new incident only after DB confirmation', async () => {
  mockSettle.mockRejectedValue({ settlementCode: 'ALREADY_PAID' }); mockPaid.mockResolvedValueOnce({ id: '11111111-1111-4111-8111-111111111111', isPaid: true });
  expect((await POST(request())).status).toBe(200); expect(mockRecord).not.toHaveBeenCalled();
});
it('typed already-paid without DB confirmation remains reviewable', async () => {
  mockSettle.mockRejectedValue({ settlementCode: 'ALREADY_PAID' });
  mockPaid.mockResolvedValueOnce({ isPaid: false, paymentNote: null }).mockResolvedValueOnce(null);
  expect((await POST(request())).status).toBe(200); expect(mockRecord).toHaveBeenCalled();
});
it('invalid signature returns400 and never settles or records', async () => {
  mockEvent.mockImplementationOnce(() => { throw new Error('bad signature'); });
  expect((await POST(request())).status).toBe(400); expect(mockSettle).not.toHaveBeenCalled(); expect(mockRecord).not.toHaveBeenCalled();
});
it('healthy signed charge settles expected cents without incident', async () => {
  expect((await POST(request())).status).toBe(200); expect(mockSettle).toHaveBeenCalledWith(expect.objectContaining({ paymentResult: expect.objectContaining({ pricePaid: '5.00' }) })); expect(mockRecord).not.toHaveBeenCalled();
});

it('DB intake unavailable returns503 before settlement, never acknowledges successful intake', async () => { mockPaid.mockRejectedValue(new Error('offline')); expect((await POST(request())).status).toBe(503); expect(mockSettle).not.toHaveBeenCalled(); });
it('existing crash-held marker acknowledges review without settlement retry', async () => { mockPaid.mockResolvedValue({ isPaid: false, paymentNote: 'STRIPE_SETTLEMENT_REQUESTED capture=ch-test' }); expect((await POST(request())).status).toBe(200); expect(mockSettle).not.toHaveBeenCalled(); });

it('confirmed non-USD charge stays visible for review instead of being silently discarded', async () => { mockEvent.mockReturnValue({ type: 'charge.succeeded', data: { object: { ...charge, currency: 'eur' } } }); expect((await POST(request())).status).toBe(200); expect(mockSettle).not.toHaveBeenCalled(); expect(mockRecord).toHaveBeenCalledWith(charge.metadata.orderId, charge.id, '5.00', null, 'CAPTURED_UNSETTLED', 'CURRENCY_MISMATCH'); });
