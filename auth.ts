import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';
import { hashPassword, verifyPassword } from './lib/password';
import { checkDevBypassCredentials } from './lib/dev-admin-bypass';
import CredentialsProvider from 'next-auth/providers/credentials';

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
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        const emailInput = (credentials.email as string)?.trim().toLowerCase();
        const passwordInput = (credentials.password as string)?.trim();

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
        try {
          // Case-insensitive so accounts created before sign-up lowercased
          // emails (e.g. "Asha@Example.com") can still sign in.
          const user = await prisma.user.findFirst({
            where: {
              email: { equals: emailInput, mode: 'insensitive' },
            },
          });

          if (user && user.password) {
            const check = await verifyPassword(passwordInput, user.password);

            if (check.ok) {
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
          }
        } catch (dbError) {
          console.error('Database authentication error:', dbError);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user, trigger, token }) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // If there is an update, set the user name
      if (trigger === 'update') {
        session.user.name = user.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
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
              const sessionCart = await prisma.cart.findFirst({
                where: { sessionCartId },
              });

              if (sessionCart) {
                // Delete current user cart
                await prisma.cart.deleteMany({
                  where: { userId: user.id },
                });

                // Assign new cart
                await prisma.cart.update({
                  where: { id: sessionCart.id },
                  data: { userId: user.id },
                });
              }
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
