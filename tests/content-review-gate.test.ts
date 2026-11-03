/**
 * Content-review gate: unreviewed owner copy must not render publicly.
 * The flag is read at build time; test both states via module re-import.
 */
describe('content review gate', () => {
  const ORIG = process.env.NEXT_PUBLIC_CONTENT_REVIEW;
  afterEach(() => {
    if (ORIG === undefined) delete process.env.NEXT_PUBLIC_CONTENT_REVIEW;
    else process.env.NEXT_PUBLIC_CONTENT_REVIEW = ORIG;
    jest.resetModules();
  });

  it('is OFF by default (public deployments hide unreviewed copy)', async () => {
    delete process.env.NEXT_PUBLIC_CONTENT_REVIEW;
    jest.resetModules();
    const m = await import('@/lib/content-review');
    expect(m.contentReviewMode).toBe(false);
  });

  it("is OFF for any value other than exactly 'true'", async () => {
    process.env.NEXT_PUBLIC_CONTENT_REVIEW = '1';
    jest.resetModules();
    const m = await import('@/lib/content-review');
    expect(m.contentReviewMode).toBe(false);
  });

  it("is ON only for exactly 'true' (protected review preview)", async () => {
    process.env.NEXT_PUBLIC_CONTENT_REVIEW = 'true';
    jest.resetModules();
    const m = await import('@/lib/content-review');
    expect(m.contentReviewMode).toBe(true);
  });
});

describe('claim honesty', () => {
  it('trust ribbon makes no carrier-tracking claim', () => {
    const { DICTIONARY } = jest.requireActual('@/lib/i18n');
    for (const lang of Object.keys(DICTIONARY)) {
      const d = DICTIONARY[lang as keyof typeof DICTIONARY] as Record<string, string>;
      expect(d.trustShippingTitle).toBeTruthy();
      expect(d.trustShippingTitle).not.toMatch(/track|track|suivi|seguimiento|verfolgung|追跡/i);
    }
  });

  it('payment note names no unconfigured provider', () => {
    const { DICTIONARY } = jest.requireActual('@/lib/i18n');
    for (const lang of Object.keys(DICTIONARY)) {
      const d = DICTIONARY[lang as keyof typeof DICTIONARY] as Record<string, string>;
      expect(d.securePaymentNote).toBeTruthy();
      expect(d.securePaymentNote).not.toMatch(/stripe|paypal/i);
    }
  });
});
