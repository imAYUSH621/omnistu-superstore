const SMTP = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'u@x.test', SMTP_PASS: 'secret' };

async function load(outcome: 'sent' | 'skipped' | 'failed' | 'throw') {
  jest.resetModules();
  jest.doMock('@/lib/auth-origin', () => ({ authOrigin: () => 'https://omnistu.com' }));
  jest.doMock('@/lib/auth-limits', () => ({
    hitLimit: jest.fn().mockResolvedValue({ allowed: true }),
    limitKey: (x: string) => x,
    LIMITS: { resetRequest: { max: 5, windowSec: 60 }, resetUse: { max: 5, windowSec: 60 } },
  }));
  jest.doMock('@/lib/password-reset', () => ({
    requestPasswordReset: outcome === 'throw' ? jest.fn().mockRejectedValue(new Error('x')) : jest.fn().mockResolvedValue(outcome),
    consumePasswordReset: jest.fn(),
  }));
  const saved = { ...process.env };
  process.env = { ...process.env, ...SMTP } as NodeJS.ProcessEnv;
  const mod = await import('@/lib/actions/password-reset.actions');
  const fd = new FormData();
  fd.set('email', 'a@b.test');
  const res = await mod.requestReset(null, fd);
  process.env = saved;
  return res;
}

describe('requestReset delivery semantics', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  it('says sent only for sent or skipped (anti-enumeration)', async () => {
    expect((await load('sent')).success).toBe(true);
    const a = await load('sent');
    const b = await load('skipped');
    expect(a).toEqual(b);
  });
  it('does not claim success when delivery failed or threw', async () => {
    for (const o of ['failed', 'throw'] as const) {
      const r = await load(o);
      expect(r.success).toBe(false);
      expect(r.message).not.toMatch(/has been sent/);
    }
  });
});
