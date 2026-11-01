/**
 * Dev-only admin sign-in bypass (replaces the hardcoded master-admin
 * credentials that shipped to production).
 *
 * The bypass is active ONLY when ALL of these hold:
 *   1. NODE_ENV is not "production"
 *   2. DEV_ADMIN_BYPASS is exactly "true"
 *   3. DEV_ADMIN_PASSWORD is set to a value of at least 12 characters
 * and the presented password matches DEV_ADMIN_PASSWORD.
 * There are no hardcoded emails or passwords anywhere in the codebase.
 */

export interface DevBypassEnv {
  NODE_ENV?: string;
  DEV_ADMIN_BYPASS?: string;
  DEV_ADMIN_EMAIL?: string;
  DEV_ADMIN_PASSWORD?: string;
}

export function isDevBypassEnabled(env: DevBypassEnv = process.env): boolean {
  if (env.NODE_ENV === 'production') return false;
  if (env.DEV_ADMIN_BYPASS !== 'true') return false;
  const pw = env.DEV_ADMIN_PASSWORD;
  return typeof pw === 'string' && pw.length >= 12;
}

export function checkDevBypassCredentials(
  email: string,
  password: string,
  env: DevBypassEnv = process.env
): boolean {
  if (!isDevBypassEnabled(env)) return false;
  const allowedEmail = (env.DEV_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  return email === allowedEmail && password === env.DEV_ADMIN_PASSWORD;
}
