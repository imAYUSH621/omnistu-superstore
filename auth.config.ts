import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

// Local development without a configured AUTH_SECRET should still boot:
// fall back to a fixed dev-only secret with a clear warning. This lives in
// the shared config so both middleware.ts and auth.ts pick it up. At real
// production runtime no fallback is applied and authjs fails closed with
// its own MissingSecret error.
const INSECURE_DEV_SECRET = 'insecure-dev-only-secret-do-not-deploy';
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const isProdRuntime = process.env.NODE_ENV === 'production' && !isBuildPhase;

if (isProdRuntime && (process.env.AUTH_SECRET === INSECURE_DEV_SECRET || process.env.NEXTAUTH_SECRET === INSECURE_DEV_SECRET)) {
  // The dev fallback must never authenticate real traffic, even if a build
  // environment or a copied .env leaks it into a production deployment.
  throw new Error('[auth] insecure dev-only AUTH_SECRET detected in production runtime - refusing to start');
}

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV !== 'production' || isBuildPhase) {
    process.env.AUTH_SECRET = INSECURE_DEV_SECRET;
    console.warn('[auth] AUTH_SECRET not set - using an insecure dev/build-only fallback. Set AUTH_SECRET in .env for anything real.');
  }
}

export const authConfig = {
  providers: [], // Required by NextAuthConfig type
  callbacks: {
    authorized({ request, auth }) {
      // Array of regex patterns of paths we want to protect
      const protectedPaths = [
        /\/shipping-address/,
        /\/payment-method/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/order\/(.*)/,
        /\/admin/,
      ];

      // Get pathname from the req URL object
      const { pathname } = request.nextUrl;
      // Check if user is not authenticated and accessing a protected path
      if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

      // Strict admin role verification
      if (pathname.startsWith('/admin') && (auth?.user as { role?: string } | undefined)?.role !== 'admin') {
        return false;
      }

      // Check for session cart cookie
      if (!request.cookies.get('sessionCartId')) {
        // Generate new session cart id cookie
        const sessionCartId = crypto.randomUUID();

        // Create new response and add the new headers
        const response = NextResponse.next({
          request: {
            headers: new Headers(request.headers),
          },
        });

        // Set newly generated sessionCartId in the response cookies
        response.cookies.set('sessionCartId', sessionCartId);

        return response;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
