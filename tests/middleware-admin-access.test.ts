/**
 * Regression: the middleware NextAuth instance is built from auth.config.ts
 * alone, so its session callback must map JWT claims (role/id) itself.
 * Otherwise every /admin page redirects even for a real admin.
 */
import { authConfig } from '@/auth.config';

const cb = authConfig.callbacks as any;

function req(pathname: string, withCart = true) {
  return {
    nextUrl: new URL(pathname, 'http://localhost:3000'),
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
  it('sends a signed-in non-admin to /unauthorized (not sign-in, which loops back to the admin URL)', () => {
    const res = cb.authorized({ request: req('/admin/orders'), auth: { user: { role: 'user' } } });
    expect(res).not.toBe(true);
    expect(res).not.toBe(false);
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')).pathname).toBe('/unauthorized');
  });
  it('rejects anonymous access to protected paths', () => {
    expect(cb.authorized({ request: req('/admin/orders'), auth: null })).toBe(false);
    expect(cb.authorized({ request: req('/order/abc'), auth: null })).toBe(false);
  });
  it('allows a signed-in non-admin onto non-admin protected paths', () => {
    expect(cb.authorized({ request: req('/order/abc'), auth: { user: { role: 'user' } } })).toBe(true);
  });
});
