import { z } from 'zod';
import { formatError } from '@/lib/utils';

describe('formatError with zod errors', () => {
  it('joins issue messages', () => {
    const r = z.object({ a: z.string().min(3, 'A too short'), b: z.number({ message: 'B must be a number' }) }).safeParse({ a: 'x', b: 'y' });
    expect(r.success).toBe(false);
    if (!r.success) expect(formatError(r.error)).toBe('A too short. B must be a number');
  });
});
