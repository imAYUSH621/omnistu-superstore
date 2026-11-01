import { shippingAddressSchema } from '@/lib/validators';

const base = { fullName: 'Test Buyer', streetAddress: '1 Main St', city: 'Austin', postalCode: '78701' };

describe('shipping address country', () => {
  it('accepts a 2-letter code', () => {
    expect(shippingAddressSchema.safeParse({ ...base, country: 'US' }).success).toBe(true);
  });
  it('accepts a full name', () => {
    expect(shippingAddressSchema.safeParse({ ...base, country: 'United States' }).success).toBe(true);
  });
  it('rejects empty and 1-character values with a helpful message', () => {
    const r = shippingAddressSchema.safeParse({ ...base, country: 'U' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/2-letter code/);
    expect(shippingAddressSchema.safeParse({ ...base, country: '  ' }).success).toBe(false);
  });
});
