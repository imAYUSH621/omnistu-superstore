const mockConstruct = jest.fn();
const mockPaid = jest.fn();
jest.mock('stripe', () => ({ __esModule: true, default: { webhooks: { constructEvent: (...a: unknown[]) => mockConstruct(...a) } } }));
jest.mock('@/lib/actions/order.actions', () => ({ updateOrderToPaid: (...a: unknown[]) => mockPaid(...a) }));
jest.mock('next/server', () => ({
  NextResponse: { json: (b: unknown, i?: { status?: number }) => ({ body: b, status: i?.status ?? 200 }) },
}));
import { POST } from '@/app/api/webhooks/stripe/route';

const req = { text: async () => '{}', headers: { get: () => 'sig' } } as never;
const charge = (o: Record<string, unknown>) => ({ type: 'charge.succeeded', data: { object: { id: 'ch_1', amount: 4250, currency: 'usd', billing_details: { email: 'a@b.co' }, metadata: { orderId: 'o1' }, ...o } } });
beforeEach(() => jest.clearAllMocks());

it('passes the exact two-decimal amount to updateOrderToPaid', async () => {
  mockConstruct.mockReturnValue(charge({}));
  await POST(req);
  expect(mockPaid).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o1', paymentResult: expect.objectContaining({ pricePaid: '42.50' }) }));
});
it('ignores a charge with no orderId metadata (undefined id would match an arbitrary order)', async () => {
  mockConstruct.mockReturnValue(charge({ metadata: {} }));
  await POST(req);
  expect(mockPaid).not.toHaveBeenCalled();
});
it('does not mark paid for a non-USD charge', async () => {
  mockConstruct.mockReturnValue(charge({ currency: 'eur' }));
  const r = (await POST(req)) as unknown as { status: number };
  expect(mockPaid).not.toHaveBeenCalled();
  expect(r.status).toBe(400);
});
