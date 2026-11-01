import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

const ENV_KEYS = ['AUTH_SECRET', 'NEXTAUTH_SECRET', 'NODE_ENV', 'NEXT_PHASE'] as const;
const saved: Record<string, string | undefined> = {};

function setEnv(nodeEnv: string, nextPhase?: string) {
  for (const k of ENV_KEYS) delete (process.env as any)[k];
  (process.env as any).NODE_ENV = nodeEnv;
  if (nextPhase) (process.env as any).NEXT_PHASE = nextPhase;
}

describe('auth secret fallback (dev/build only, production fails closed)', () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    jest.resetModules();
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete (process.env as any)[k];
      else (process.env as any)[k] = saved[k];
    }
    jest.resetModules();
  });

  test('development without a secret gets the insecure fallback with a warning', () => {
    setEnv('development');
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBe('insecure-dev-only-secret-do-not-deploy');
  });

  test('test environment without a secret gets the insecure fallback', () => {
    setEnv('test');
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBe('insecure-dev-only-secret-do-not-deploy');
  });

  test('production build phase without a secret gets the fallback so next build passes', () => {
    setEnv('production', 'phase-production-build');
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBe('insecure-dev-only-secret-do-not-deploy');
  });

  test('production RUNTIME without a secret gets NO fallback (authjs must fail closed)', () => {
    setEnv('production'); // no NEXT_PHASE: this is `next start` serving traffic
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBeUndefined();
    expect(process.env.NEXTAUTH_SECRET).toBeUndefined();
  });

  test('build-phase fallback cannot survive into a later production runtime import', () => {
    setEnv('production', 'phase-production-build');
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBe('insecure-dev-only-secret-do-not-deploy');
    // Simulate the separate runtime process: env carries no secret at all.
    jest.resetModules();
    setEnv('production');
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBeUndefined();
  });

  test('production runtime refuses to start if the insecure dev secret is deployed by misconfiguration', () => {
    setEnv('production');
    (process.env as any).AUTH_SECRET = 'insecure-dev-only-secret-do-not-deploy';
    expect(() => require('../auth.config')).toThrow(/insecure dev-only/);
  });

  test('production runtime also refuses the insecure secret via NEXTAUTH_SECRET', () => {
    setEnv('production');
    (process.env as any).NEXTAUTH_SECRET = 'insecure-dev-only-secret-do-not-deploy';
    expect(() => require('../auth.config')).toThrow(/insecure dev-only/);
  });

  test('a configured secret is never overwritten', () => {
    setEnv('development');
    (process.env as any).AUTH_SECRET = 'real-secret';
    require('../auth.config');
    expect(process.env.AUTH_SECRET).toBe('real-secret');
  });
});
