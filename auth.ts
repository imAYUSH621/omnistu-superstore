import { parseCredentialInput } from '@/lib/auth-credential-input';
import { transferGuestCart } from '@/lib/auth-cart-lifecycle';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';
import { hashPassword, verifyPasswordGated, dummyVerify, HashBusyError } from './lib/password';
import { hitLimit, clearLimit, limiterBlocksSignin, signinClientIp, LIMITS } from './lib/auth-limits';
import { getSessionVersion } from './lib/session-version';
import { checkDevBypassCredentials } from './lib/dev-admin-bypass';
import CredentialsProvider from 'next-auth/providers/credentials';
import {optionalGoogleProvider} from '@/lib/google-auth-provider';
import {allowGoogleSignIn} from '@/lib/google-auth-signin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    ...optionalGoogleProvider(),
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials, request) {
        if (credentials == null) return null;

        const parsedInput = parseCredentialInput(credentials);
        if (!parsedInput) return null;
        const { email: emailInput, password: passwordInput } = parsedInput;

        // Per-IP attempt ceiling. On Vercel, x-forwarded-for is overwritten by
        // the edge with the real client IP and external values are NOT
        // forwarded (anti-spoofing; vercel.com/docs/edge-network/headers).
        // Without a trustworthy header (local/dev), skip: the per-email limit
        // still applies. Refusal is the same generic null as a bad password.
        const clientIp = signinClientIp(request as Request | undefined, process.env.NODE_ENV);
        if (clientIp) {
          const ipLim = await hitLimit('signin-ip', clientIp, LIMITS.signinIp.max, LIMITS.signinIp.windowSec);
          if (limiterBlocksSignin(ipLim, process.env.NODE_ENV)) return null;
        }

        // 1. DEV-ONLY admin bypass: active solely outside production when
        // DEV_ADMIN_BYPASS=true and a >=12-char DEV_ADMIN_PASSWORD is set.
        // No credentials are hardcoded; production always skips this path.
        if (checkDevBypassCredentials(emailInput, passwordInput)) {
          try {
            let dbAdmin = await prisma.user.findFirst({
              where: { role: 'admin' },
            });

            if (!dbAdmin) {
              dbAdmin = await prisma.user.create({
                data: {
                  name: 'Omnistu Dev Admin',
                  email: emailInput,
                  role: 'admin',
                },
              });
            }

            if (dbAdmin) {
              return {
                id: dbAdmin.id,
                name: dbAdmin.name || 'Omnistu Dev Admin',
                email: dbAdmin.email,
                role: 'admin',
              };
            }
          } catch (e) {
            console.warn('Prisma DB lookup error during dev admin bypass:', e);
          }
        }

        // 2. Standard Database User Lookup
        // Attempt limit per email, enforced here so the direct auth endpoint is covered too.
        const lim = await hitLimit('signin', emailInput, LIMITS.signin.max, LIMITS.signin.windowSec);
        if (limiterBlocksSignin(lim, process.env.NODE_ENV)) return null;
        try {
          // Case-insensitive so accounts created before sign-up lowercased
          // emails (e.g. "Asha@Example.com") can still sign in.
          const users = await prisma.user.findMany({
            where: {
              email: { equals: emailInput, mode: 'insensitive' },
            },
            take: 2,
            select: { id: true, name: true, email: true, password: true, role: true },
          });
          // Never choose an account by row order when legacy emails collide.
          const user = users.length === 1 ? users[0] : null;

          if (user && user.password) {
            const check = await verifyPasswordGated(passwordInput, user.password);

            if (check.ok) {
              await clearLimit('signin', emailInput);
              if (check.needsUpgrade) {
                // Old keyed-digest hash: rewrite with the slow salted hash now
                // that we hold the correct plain password.
                try {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { password: await hashPassword(passwordInput) },
                  });
                } catch (e) {
                  console.warn('password hash upgrade failed', e instanceof Error ? e.name : 'error');
                }
              }
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          } else {
            // Unknown email or no password set: spend the same hashing work so
            // response time does not reveal which emails exist (measured only
            // locally as a microbenchmark, not over HTTP).
            await dummyVerify(passwordInput);
          }
        } catch (dbError) {
          if (dbError instanceof HashBusyError) return null;
          console.error('Database authentication error:', dbError);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({account,profile}) {
      if(account?.provider!=='google')return true;
      return allowGoogleSignIn(profile,prisma);
    },
    async session({ session, user, trigger, token }) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // If there is an update, set the user name
      if (trigger === 'update') {
        session.user.name = user?.name ?? token.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      const tk = token as typeof token & { sv?: number };
      if (user?.id) {
        tk.sv = await getSessionVersion(user.id);
      } else if (token.sub) {
        // An older token (before a password change) is no longer valid.
        const current = await getSessionVersion(token.sub);
        if (current !== (tk.sv ?? 0)) return null;
      }
      // Assign user fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;

        // If user has no name then use the email
        if (user.name === 'NO_NAME') {
          token.name = user.email!.split('@')[0];

          // Update database to reflect the token name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }

        if (trigger === 'signIn' || trigger === 'signUp') {
          try {
            const cookiesObject = await cookies();
            const sessionCartId = cookiesObject.get('sessionCartId')?.value;

            if (sessionCartId && user.id && user.id !== 'master-admin-001') {
              await transferGuestCart(user.id, sessionCartId);
            }
          } catch (cartErr) {
            console.warn('Non-fatal cart synchronization notice:', cartErr);
          }
        }
      }

      // Handle session updates
      if (session?.user.name && trigger === 'update') {
        token.name = session.user.name;
      }

      return token;
    },
  },
});
