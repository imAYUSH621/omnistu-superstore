const SMTP = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'u@x.test', SMTP_PASS: 'secret' };

async function load(outcome: 'sent' | 'skipped' | 'failed' | 'throw') {
  jest.resetModules();
  const pending: Promise<unknown>[] = [];
  jest.doMock('next/server', () => ({ after: (fn: () => Promise<void>) => { pending.push(fn()); } }));
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
  await Promise.all(pending);
  process.env = saved;
  return res;
}

describe('requestReset public reply is uniform (anti-enumeration)', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));
  it('same response whether the link was sent, skipped (no account), failed or threw', async () => {
    const sent = await load('sent');
    expect(sent.success).toBe(true);
    for (const o of ['skipped', 'failed', 'throw'] as const) expect(await load(o)).toEqual(sent);
  });
  it('never claims the email was already sent', async () => {
    expect((await load('failed')).message).not.toMatch(/has been sent|was sent/);
  });
});
