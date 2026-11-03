/**
 * Deterministic assistant TEST mode: rule-based grounded answers when no LLM
 * key exists and ASSISTANT_TEST_MODE=true. Nothing goes to an external model;
 * order help stays fail-closed self-serve; every answer is labeled.
 */
import { deterministicTestAnswer, ASSISTANT_TEST_LABEL } from '@/lib/chat';
import * as fs from 'fs';

describe('deterministic assistant test mode', () => {
  it('labels every answer as a rule-based demo', async () => {
    for (const q of ['hello', 'where is my order?', 'what payment methods?', 'what is the refund policy?', 'wireless earbuds']) {
      const a = await deterministicTestAnswer(q);
      expect(a.startsWith(ASSISTANT_TEST_LABEL)).toBe(true);
    }
  });

  it('order help stays fail-closed self-serve and retrieves nothing', async () => {
    const a = await deterministicTestAnswer('track my order OMN-ABC-123');
    expect(a).toContain('do not retrieve order data');
    expect(a).not.toContain('OMN-ABC-123 status');
  });

  it('policy questions refuse to quote unapproved terms', async () => {
    const a = await deterministicTestAnswer('what is the refund policy?');
    expect(a.toLowerCase()).toContain('draft');
    expect(a).not.toContain('30-day');
  });

  it('route only uses test mode without a key and with explicit opt-in', () => {
    const src = fs.readFileSync('app/api/chat/route.ts', 'utf8');
    expect(src).toContain("process.env.ASSISTANT_TEST_MODE === 'true'");
    const noKey = src.indexOf('if (!apiKey)');
    const testMode = src.indexOf("ASSISTANT_TEST_MODE === 'true'");
    const s503 = src.indexOf('currently configuring keys', testMode);
    expect(testMode).toBeGreaterThan(noKey);
    expect(s503).toBeGreaterThan(testMode);
  });

  it('deterministic mode never calls an external model', () => {
    const src = fs.readFileSync('lib/chat.ts', 'utf8');
    const block = src.slice(src.indexOf('deterministicTestAnswer'));
    expect(block).not.toContain('integrate.api.nvidia.com');
    expect(block).not.toContain('api.groq.com');
    expect(block).not.toContain('lookupOrder(');
  });
});
