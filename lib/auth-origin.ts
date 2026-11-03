// Canonical origin for auth redirects and emailed links. On Vercel preview
// deployments there may be no fixed public URL (shareable-link access is per
// deployment URL), so fall back to this deployment's own URL instead of a
// hardcoded alias that sits outside deployment protection.
export function authOrigin(): string | undefined {
  return (
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  );
}
