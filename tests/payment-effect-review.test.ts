import { recordPaymentEffectsForReview, PAYMENT_EFFECT_REVIEW_STATUS } from '@/lib/payment-effect-review';
import { dueFulfillmentTasks } from '@/lib/fulfillment-queue';
const mockFindMany = jest.fn();
jest.mock('@/db/prisma', () => ({ prisma: { fulfillmentTask: { findMany: (...a: unknown[]) => mockFindMany(...a) } } }));
it('writes passive review status only, no personal details or runnable retries', async () => {
  const create = jest.fn();
  await recordPaymentEffectsForReview({ fulfillmentTask: { create } } as never, 'order-1');
  const data = create.mock.calls[0][0].data;
  expect(data).toMatchObject({ orderId: 'order-1', status: 'REVIEW_ONLY', maxAttempts: 0 });
  expect(JSON.stringify(data.payload)).not.toMatch(/customer_email|shipping_address|client_secret/);
});
it('passive status is excluded from every due-task query', async () => {
  mockFindMany.mockResolvedValue([]); await dueFulfillmentTasks();
  const states = mockFindMany.mock.calls[0][0].where.status.in;
  expect(states).toEqual(['PENDING', 'RETRYING']); expect(states).not.toContain(PAYMENT_EFFECT_REVIEW_STATUS);
});
