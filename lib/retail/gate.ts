/** Release is off by default. Initial qualification accepts TESTONLY, never live commerce.
 * This does not assert database or merchant readiness. Hosting must separately qualify
 * the runtime identity, migrations, access policy and destination/source records. */
export function qualifiedRetailTestEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.QUALIFIED_RETAIL_TEST_CHECKOUT !== 'true' || env.TEST_CHECKOUT_MODE !== 'true') return false;
  if (env.NODE_ENV !== 'production') {
    try { return ['localhost', '127.0.0.1'].includes(new URL(env.DATABASE_URL || '').hostname); } catch { return false; }
  }
  return env.VERCEL_ENV === 'preview' && !!env.QUALIFIED_RETAIL_TEST_PROJECT_ID && env.VERCEL_PROJECT_ID === env.QUALIFIED_RETAIL_TEST_PROJECT_ID;
}
