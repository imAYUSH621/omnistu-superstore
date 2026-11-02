import { STORE_KNOWLEDGE, findStoreKnowledge } from '../lib/store-knowledge';
import { SYSTEM_PROMPT } from '../lib/chat';

describe('store knowledge retrieval', () => {
  test('shipping timeframe questions get the policies-pending chunk, not a promise', () => {
    const k = findStoreKnowledge('how many days does shipping to India take?');
    expect(k).toContain('NOT confirmable');
    expect(k).toContain('/contact');
    expect(k).not.toMatch(/\d+\s*(business )?days?/i);
  });

  test('order tracking questions get the order-status chunk', () => {
    const k = findStoreKnowledge('where is my package, has it shipped?');
    expect(k).toContain('order page');
    expect(k).toContain('does not retrieve order details');
  });

  test('human-agent requests get the contact chunk', () => {
    const k = findStoreKnowledge('can I talk to a real person about a problem?');
    expect(k).toContain('/contact');
  });

  test('returns at most two chunks and nothing for gibberish', () => {
    expect(findStoreKnowledge('zzqqx jjj')).toBe('');
    const many = findStoreKnowledge('shipping refund cancel order tracking human support');
    expect(many.split('\n').length).toBeLessThanOrEqual(2);
  });

  test('knowledge links are on-site paths only', () => {
    for (const c of STORE_KNOWLEDGE) {
      if (c.link) expect(c.link).toMatch(/^\/[a-z-]*$/);
    }
  });

  test('no chunk quotes unapproved policy terms (days, guarantees, percentages)', () => {
    for (const c of STORE_KNOWLEDGE) {
      expect(c.text).not.toMatch(/\d+[- ]day/i);
      expect(c.text).not.toContain('money-back');
      expect(c.text).not.toContain('100%');
      expect(c.text).not.toContain('guarantee.');
    }
  });
});

describe('assistant prompt honesty', () => {
  test('prompt never cites an unconfirmed support mailbox', () => {
    expect(SYSTEM_PROMPT).not.toContain('support@omnistu.com');
    expect(SYSTEM_PROMPT).not.toContain('team@omnistu.com');
  });

  test('prompt forbids quoting policy terms and routes them to the contact form', () => {
    expect(SYSTEM_PROMPT).toContain('not confirmable');
    expect(SYSTEM_PROMPT).toContain('/contact');
    expect(SYSTEM_PROMPT).toContain('never quote a number of days');
  });

  test('prompt keeps the no-unverified-popularity guard', () => {
    expect(SYSTEM_PROMPT).toContain('no verified data');
  });
});
