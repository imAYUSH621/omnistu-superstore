/**
 * Content-review gate for owner-unreviewed public copy.
 *
 * Blog articles and the detailed services catalog are drafted wording that the
 * owner has NOT reviewed yet (the owner asked "should we write blogs?" - that
 * is not approval of specific articles as Omnistu's public voice). Until each
 * is approved, public deployments must not show them.
 *
 * NEXT_PUBLIC_CONTENT_REVIEW=true (build-time) shows the unreviewed content.
 * Set it ONLY on the protected review preview deployment (share-link), never
 * on the public apex. Default (unset) keeps public deployments honest:
 * /blog and /services render a "coming soon" state, article/detail pages 404,
 * and the fabricated-claims marketing pages (/affiliates, /currency, /about,
 * /press, /sustainability) redirect to home via next.config edge redirects.
 */
export const contentReviewMode = process.env.NEXT_PUBLIC_CONTENT_REVIEW === 'true';
