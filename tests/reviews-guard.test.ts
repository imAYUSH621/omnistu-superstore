/**
 * Sample-fallback guard: products rendered from sample data carry
 * `sample-<slug>` ids; review actions must not pass them to uuid columns.
 */
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockAuth = jest.fn();
jest.mock('@/db/prisma', () => ({
  prisma: { review: { findMany: (...a: unknown[]) => mockFindMany(...a), findFirst: (...a: unknown[]) => mockFindFirst(...a) } },
}));
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));

import { getReviews, getReviewByProductId } from '@/lib/actions/review.actions';

describe('review actions sample-id guard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getReviews returns empty for sample ids without touching the DB', async () => {
    const res = await getReviews({ productId: 'sample-royal-kashmiri-mongra-saffron' });
    expect(res.data).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('getReviews queries for real uuid product ids', async () => {
    mockFindMany.mockResolvedValueOnce([{ id: 'r1' }]);
    const res = await getReviews({ productId: '053471c5-3342-4fd4-a2eb-53e9e744036e' });
    expect(res.data).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it('getReviewByProductId returns null for sample ids without touching the DB', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    const res = await getReviewByProductId({ productId: 'sample-x' });
    expect(res).toBeNull();
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});
