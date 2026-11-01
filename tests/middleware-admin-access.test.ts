/**
 * Regression: the middleware NextAuth instance is built from auth.config.ts
 * alone, so its session callback must map JWT claims (role/id) itself.
 * Otherwise every /admin page redirects even for a real admin.
 */
import { authConfig } from '@/auth.config';

const cb = authConfig.callbacks as any;

function req(pathname: string, withCart = true) {
  return {
    nextUrl: { pathname },
    cookies: { get: () => (withCart ? { value: 'cart-1' } : undefined) },
    headers: new Headers(),
  } as any;
}

describe('middleware session mapping', () => {
  it('copies role and id from the JWT into the session', async () => {
    const session = await cb.session({
      session: { user: { name: null }, expires: '' },
      token: { sub: 'u1', role: 'admin', name: 'John' },
    });
    expect(session.user.id).toBe('u1');
    expect(session.user.role).toBe('admin');
  });
});

describe('authorized() admin gating', () => {
  it('allows an admin session onto /admin pages', () => {
    expect(cb.authorized({ request: req('/admin/orders'), auth: { user: { role: 'admin' } } })).toBe(true);
  });
  it('rejects a non-admin session on /admin pages', () => {
    expect(cb.authorized({ request: req('/admin/orders'), auth: { user: { role: 'user' } } })).toBe(false);
  });
  it('rejects anonymous access to protected paths', () => {
    expect(cb.authorized({ request: req('/admin/orders'), auth: null })).toBe(false);
    expect(cb.authorized({ request: req('/order/abc'), auth: null })).toBe(false);
  });
  it('allows a signed-in non-admin onto non-admin protected paths', () => {
    expect(cb.authorized({ request: req('/order/abc'), auth: { user: { role: 'user' } } })).toBe(true);
  });
});
