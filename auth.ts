import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';
import { compare } from './lib/encrypt';
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

        // 1. MASTER ADMIN EMERGENCY BYPASS (Guarantees zero-lockout for admin testing)
        const allowedAdminEmails = [
          'admin@example.com',
          'admin@omnistu.com',
          'ayush@omnistu.com',
          'ayushjee2155@gmail.com',
          'admin',
        ];
        const validAdminPasswords = [
          '123456',
          'admin123456',
          'Admin@Omnistu2026',
          '2026',
          'admin',
        ];

        if (
          allowedAdminEmails.includes(emailInput) &&
          validAdminPasswords.includes(passwordInput)
        ) {
          try {
            // Find existing admin or admin@example.com
            const adminEmail = emailInput.includes('@') ? emailInput : 'admin@example.com';
            let dbAdmin = await prisma.user.findFirst({
              where: {
                OR: [{ email: adminEmail }, { role: 'admin' }],
              },
            });

            if (!dbAdmin) {
              dbAdmin = await prisma.user.create({
                data: {
                  name: 'Omnistu SuperAdmin',
                  email: adminEmail,
                  role: 'admin',
                },
              });
            }

            if (dbAdmin) {
              return {
                id: dbAdmin.id,
                name: dbAdmin.name || 'Omnistu SuperAdmin',
                email: dbAdmin.email,
                role: 'admin',
              };
            }
          } catch (e) {
            console.warn('Prisma DB lookup error during admin bypass:', e);
          }

          return {
            id: 'master-admin-001',
            name: 'Omnistu SuperAdmin',
            email: emailInput.includes('@') ? emailInput : 'admin@example.com',
            role: 'admin',
          };
        }

        // 2. Standard Database User Lookup
        try {
          const user = await prisma.user.findFirst({
            where: {
              email: emailInput,
            },
          });

          if (user && user.password) {
            const isMatch = await compare(passwordInput, user.password);

            if (isMatch) {
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
