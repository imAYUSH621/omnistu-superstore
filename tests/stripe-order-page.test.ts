/** Render regression: authorized order page delegates instead of creating a fresh intent per render. */
const mockIntent = jest.fn(); const mockCreate = jest.fn();
jest.mock('@/lib/actions/order.actions', () => ({ getOrderById: jest.fn(async () => ({ id: 'o1', userId: 'u1', paymentMethod: 'Stripe', isPaid: false, totalPrice: '5.00', shippingAddress: {} })) }));
jest.mock('@/auth', () => ({ auth: jest.fn(async () => ({ user: { id: 'u1', role: 'user' } })) }));
jest.mock('@/lib/stripe-intent', () => ({ stripeClientSecretForOrder: (...a: unknown[]) => mockIntent(...a) }));
jest.mock('stripe', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({ paymentIntents: { create: (...a: unknown[]) => mockCreate(...a) } })) }));
jest.mock('@/app/(root)/order/[id]/order-details-table', () => ({ __esModule: true, default: () => null }));
import Page from '@/app/(root)/order/[id]/page';
it('repeated render uses guarded binding helper, never directly creates provider intent', async () => {
  process.env.STRIPE_SECRET_KEY = 'mock-only'; mockCreate.mockResolvedValue({ client_secret: 'mock-only' }); mockIntent.mockResolvedValue(null);
  try { await Page({ params: Promise.resolve({ id: 'o1' }) }); await Page({ params: Promise.resolve({ id: 'o1' }) }); expect(mockIntent).toHaveBeenCalledTimes(2); expect(mockCreate).not.toHaveBeenCalled(); } finally { delete process.env.STRIPE_SECRET_KEY; }
});
