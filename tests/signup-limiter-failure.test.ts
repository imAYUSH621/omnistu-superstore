const create = jest.fn();
const signin = jest.fn();
jest.mock('@/db/prisma', () => ({ prisma: { user: { create: (...args: unknown[]) => create(...args) } } }));
jest.mock('@/auth', () => ({ auth: jest.fn(), signIn: (...args: unknown[]) => signin(...args), signOut: jest.fn() }));
jest.mock('@/lib/auth-limits', () => ({ hitLimit: async () => ({ allowed: true, available: false }), LIMITS: { signup: { max: 5, windowSec: 60 } } }));
import { signUpUser } from '@/lib/actions/user.actions';
test('production signup refuses unavailable limiter before creating or signing in', async () => {
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: 'production' });
  try {
    const form = new FormData();
    for (const [key, value] of Object.entries({ name: 'Sample User', email: 'sample@example.invalid', password: 'Sample!123', confirmPassword: 'Sample!123' })) form.set(key, value);
    expect(await signUpUser(null, form)).toMatchObject({ success: false });
    expect(create).not.toHaveBeenCalled();
    expect(signin).not.toHaveBeenCalled();
  } finally {
    Object.assign(process.env, { NODE_ENV: previous });
  }
});
