import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { detectLocale } from './lib/locale-detect';

const baseAuthMiddleware = NextAuth(authConfig).auth as unknown as (
  req: NextRequest
) => Promise<Response | null | undefined>;

const LANG_COOKIE = 'omnistu_lang';
const CURRENCY_COOKIE = 'omnistu_currency';

function preferenceCookie(name: string, value: string, secure: boolean): string {
  return `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/**
 * First-visit locale seeding. When the visitor has no stored preference,
 * detect language (Accept-Language) and display currency (Vercel geo
 * country) and persist them as cookies on the response. Existing cookies
 * always win: a manual choice in the selector and a previous detection
 * both count as the visitor's preference and are never overwritten.
 * Unknown / VPN / unmapped signals fall back to EN + USD
 * (see lib/locale-detect.ts). Settlement stays USD regardless.
 */
async function middleware(req: NextRequest) {
  const res = (await baseAuthMiddleware(req)) ?? NextResponse.next();

  const isHtmlGet =
    req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html');
  const hasLang = Boolean(req.cookies.get(LANG_COOKIE)?.value);
  const hasCurrency = Boolean(req.cookies.get(CURRENCY_COOKIE)?.value);

  if (isHtmlGet && (!hasLang || !hasCurrency)) {
    const detected = detectLocale(
      req.headers.get('x-vercel-ip-country'),
      req.headers.get('accept-language')
    );
    const secure = req.nextUrl.protocol === 'https:';
    // Append Set-Cookie to whatever the auth middleware returned (including
    // redirects), never replacing the response itself.
    if (!hasLang) res.headers.append('Set-Cookie', preferenceCookie(LANG_COOKIE, detected.lang, secure));
    if (!hasCurrency) res.headers.append('Set-Cookie', preferenceCookie(CURRENCY_COOKIE, detected.currency, secure));
  }

  return res;
}

export default middleware;
