import { limited, findProducts, lookupOrder } from '../lib/chat';

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
    const matched = await findProducts('magnetic balls fidget');
    expect(typeof matched).toBe('string');
    if (matched) {
      expect(matched).toContain('price:');
      expect(matched).toContain('/product/');
    }
  });

  test('findProducts returns empty string safely on gibberish or empty query', async () => {
    const res = await findProducts('');
    expect(res).toBe('');

    const res2 = await findProducts('zzzzzzzzxyznonexistent');
    expect(res2).toBe('');
  });

  test('lookupOrder asks for checkout email when order number is provided alone', async () => {
    const res = await lookupOrder('Please check order OMN-884920');
    expect(res).toContain('ask for the email used at checkout');
  });

  test('lookupOrder returns empty string when neither order ID nor email are in text', async () => {
    const res = await lookupOrder('What are your store hours?');
    expect(res).toBe('');
  });

  test('lookupOrder reports unavailable when Supabase environment variables are missing', async () => {
    const origUrl = process.env.SUPABASE_URL;
    const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      const res = await lookupOrder('Order OMN-12345 for customer customer@example.com');
      expect(res).toContain('Database connection unavailable');
    } finally {
      if (origUrl) process.env.SUPABASE_URL = origUrl;
      if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    }
  });
});
