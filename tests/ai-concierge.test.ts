const mockProducts = [
  { name: 'Pro ANC Active Noise Cancelling Wireless Earbuds', slug: 'pro-anc-earbuds', price: '39.99', category: 'Tech & Gadgets', brand: 'Omnistu', description: 'Wireless earbuds.', stock: 5, rating: '4.9', numReviews: 1480 },
  { name: 'Royal Kashmiri Mongra Saffron (2g)', slug: 'royal-kashmiri-mongra-saffron', price: '24.99', category: 'Gourmet & Indian Food', brand: 'Omnistu', description: 'Saffron threads.', stock: 0, rating: '4.9', numReviews: 1480 },
  { name: 'Authentic Masala Chai Tea Blend', slug: 'masala-chai', price: '16.99', category: 'Gourmet & Indian Food', brand: 'Omnistu', description: 'Chai tea.', stock: 9, rating: '5', numReviews: 9999 },
];
jest.mock('@/lib/actions/product.actions', () => ({
  getAllProducts: jest.fn(async () => ({ data: mockProducts, totalPages: 1 })),
}));
import { limited, findProducts, lookupOrder, SYSTEM_PROMPT } from '../lib/chat';

describe('AI Concierge Assistant Edge Cases', () => {
  test('rate limiter tracks hits and throttles abusive IP addresses', () => {
    const testIp = '192.168.1.100';
    for (let i = 0; i < 20; i++) {
      limited(testIp);
    }
    // 21st request should be throttled
    expect(limited(testIp)).toBe(true);

    // Fresh IP should not be limited
    expect(limited('10.0.0.1')).toBe(false);
  });

  test('findProducts parses catalog correctly and returns matched product links', async () => {
    const matched = await findProducts('wireless earbuds');
    expect(typeof matched).toBe('string');
    expect(matched).toContain('price:');
    expect(matched).toContain('/product/pro-anc-earbuds');
    expect(matched).toContain('$39.99');
  });

  test('findProducts grounds Indian Food queries like saffron and chai with catalog items', async () => {
    const saffronMatched = await findProducts('Kashmiri saffron');
    expect(saffronMatched).toContain('Saffron');
    expect(saffronMatched).toContain('/product/royal-kashmiri-mongra-saffron');
    expect(saffronMatched).toContain('currently out of stock');

    const chaiMatched = await findProducts('Masala chai tea');
    expect(chaiMatched).toContain('Chai');
    expect(chaiMatched).toContain('/product/masala-chai');
  });

  test('assistant never surfaces or ranks by unverified ratings, review counts or badges', async () => {
    for (const q of ['best seller', 'top rated products', '4.9 stars', '1480 reviews', 'trending']) {
      const r = await findProducts(q);
      expect(r).not.toMatch(/4\.9|1480|1,480|9999|best seller|top rated|stars|reviews/i);
    }
    const r = await findProducts('masala chai');
    expect(r).not.toMatch(/rating|review|star/i);
    expect(SYSTEM_PROMPT).toMatch(/Never say a product is a best seller/);
  });

  test('findProducts returns empty string safely on gibberish or empty query', async () => {
    const res = await findProducts('');
    expect(res).toBe('');

    const res2 = await findProducts('zzzzzzzzxyznonexistent');
    expect(res2).toBe('');
  });

  test('lookupOrder fails closed by default and never touches data', async () => {
    delete process.env.CHAT_ORDER_LOOKUP;
    const f = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = f;
    const res = await lookupOrder('Please check order OMN-884920 for a@b.co');
    expect(res).toContain('turned off');
    expect(res).toContain('order page');
    expect(f).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test('lookupOrder returns empty string when no order ID is in text', async () => {
    const res = await lookupOrder('What are your store hours?');
    expect(res).toBe('');
  });

  test('lookupOrder enabled asks for checkout email when order number is provided alone', async () => {
    process.env.CHAT_ORDER_LOOKUP = 'enabled';
    try {
      const res = await lookupOrder('Please check order OMN-884920');
      expect(res).toContain('ask for the email used at checkout');
    } finally {
      delete process.env.CHAT_ORDER_LOOKUP;
    }
  });

  test('lookupOrder enabled reports unavailable when Supabase environment variables are missing', async () => {
    const origUrl = process.env.SUPABASE_URL;
    const origAnon = process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.CHAT_ORDER_LOOKUP = 'enabled';

    try {
      const res = await lookupOrder('Order OMN-12345 for customer customer@example.com');
      expect(res).toContain('unavailable');
    } finally {
      if (origUrl) process.env.SUPABASE_URL = origUrl;
      if (origAnon) process.env.SUPABASE_ANON_KEY = origAnon;
      delete process.env.CHAT_ORDER_LOOKUP;
    }
  });
});
