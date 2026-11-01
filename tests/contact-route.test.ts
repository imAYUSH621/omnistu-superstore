import { describe, expect, test } from '@jest/globals';
import { POST } from '@/app/api/contact/route';

function req(body: unknown) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('contact route (G5)', () => {
  test('rejects invalid JSON', async () => {
    const res = await POST(req('not-json{'));
    expect(res.status).toBe(400);
  });

  test('rejects missing/short fields with 400', async () => {
    expect((await POST(req({ name: 'A', email: 'a@b.co', message: 'hello world!' }))).status).toBe(400);
    expect((await POST(req({ name: 'Ayush', email: 'nope', message: 'hello world!' }))).status).toBe(400);
    expect((await POST(req({ name: 'Ayush', email: 'a@b.co', message: 'short' }))).status).toBe(400);
  });

  test('valid message without configured mailbox returns honest 503, never fake success', async () => {
    const savedEmail = process.env.SUPPORT_EMAIL;
    const savedKey = process.env.RESEND_API_KEY;
    delete process.env.SUPPORT_EMAIL;
    delete process.env.RESEND_API_KEY;
    const res = await POST(req({ name: 'Ayush Anand', email: 'ayush@example.com', message: 'Where is my demo order?' }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.configured).toBe(false);
    expect(data.error).toMatch(/not configured/i);
    if (savedEmail !== undefined) process.env.SUPPORT_EMAIL = savedEmail;
    if (savedKey !== undefined) process.env.RESEND_API_KEY = savedKey;
  });
});
