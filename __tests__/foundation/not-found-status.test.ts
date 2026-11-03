import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * A root-level app/loading.tsx wraps the ENTIRE app in one Suspense boundary.
 * Next.js then flushes the loading shell with HTTP 200 before dynamic page
 * components run, so a later notFound() or redirect() can no longer set the
 * status: invalid /product/[slug], /order/[id], /blog/[slug] etc. returned
 * 200 with the not-found UI streamed in, and /dp/[id] redirects degraded to
 * a 200 meta-refresh page (verified on production and reproduced on Next
 * 15.5.28 with and without a root loader).
 *
 * Fix: no root loading.tsx. If instant loading feedback is wanted for a slow
 * route, add a segment-scoped loading.tsx to that route's directory only,
 * and only where the segment does not rely on notFound()/redirect() status
 * semantics.
 */
describe('soft-404 regression guard', () => {
  it('has no root-level app/loading.tsx (it turns every notFound()/redirect() into a 200 stream)', () => {
    expect(existsSync(path.join(process.cwd(), 'app', 'loading.tsx'))).toBe(false);
  });
});
