jest.mock('@/lib/constants', () => ({ PAYMENT_METHODS: ['TestPayment', 'PayPal', 'TestPayment', 'PayPal'] }));
import { getPaymentMethodStatuses } from '@/lib/payment-capabilities';

describe('configured payment method deduplication', () => {
  it('renders one enabled TestPayment in explicit simulation mode', () => {
    const methods = getPaymentMethodStatuses({ NODE_ENV: 'production', TEST_CHECKOUT_MODE: 'true' });
    expect(methods.filter((m) => m.method === 'TestPayment')).toEqual([{ method: 'TestPayment', enabled: true }]);
    expect(methods.filter((m) => m.method === 'PayPal')).toHaveLength(1);
    expect(methods.find((m) => m.method === 'PayPal')?.enabled).toBe(false);
  });
  it('never exposes configured TestPayment outside simulation mode', () => {
    expect(getPaymentMethodStatuses({ NODE_ENV: 'production', ORDERS_ENABLED: 'true' }).some((m) => m.method === 'TestPayment')).toBe(false);
  });
});
