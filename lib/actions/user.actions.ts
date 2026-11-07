'use server';

import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
  paymentMethodSchema,
  updateUserSchema,
} from '../validators';
import { auth, signIn, signOut } from '@/auth';
import { isPaymentMethodAvailable } from '@/lib/payment-capabilities';
import { safeCallbackPath } from '@/lib/safe-callback';
import { authOrigin } from '@/lib/auth-origin';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { hashPassword } from '../password';
import { hitLimit, LIMITS } from '../auth-limits';
import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { ShippingAddress } from '@/types';
import { z } from 'zod';
import { PAGE_SIZE, USER_ROLES } from '../constants';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../auth-guard';
import { Prisma } from '@prisma/client';
import { deleteUserCartForSignout } from '@/lib/auth-cart-lifecycle';

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', { ...user, redirectTo: safeCallbackPath(formData.get('callbackUrl'), authOrigin()) });

    return { success: true, message: 'Signed in successfully' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: 'Invalid email or password' };
  }
}

// Sign user out
export async function signOutUser() {
  // Signing out must remain possible even when authentication storage fails.
  try {
    const session = await auth();
    if (session?.user?.id) await deleteUserCartForSignout(session.user.id);
  } catch {
    // Cart cleanup is best-effort. Do not strand the authentication cookie.
  }
  await signOut();
}

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const lim = await hitLimit('signup', user.email, LIMITS.signup.max, LIMITS.signup.windowSec);
    if (!lim.allowed) return { success: false, message: 'Too many attempts. Try again later.' };
    if (!lim.available && process.env.NODE_ENV === 'production') return { success: false, message: 'Account registration is not available right now. Try again later.' };
    const plainPassword = user.password;

    user.password = await hashPassword(user.password);

    // Serialize normalized-email registration to avoid case-variant accounts.
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`signup:${user.email}`}))`;
      const existing = await tx.user.findFirst({
        where: { email: { equals: user.email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing) throw new Error('Unable to register this email. Try signing in or resetting your password.');
      await tx.user.create({ data: { name: user.name, email: user.email, password: user.password } });
    });

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
      redirectTo: safeCallbackPath(formData.get('callbackUrl'), authOrigin()),
    });

    return { success: true, message: 'User registered successfully' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }
}

// Get user by the ID
export async function getUserById(userId: string) {
  // A server action is callable from the network: only the signed-in owner or
  // an admin may read a user record, and the password hash is never returned.
  const session = await auth();
  if (!session?.user?.id || (session.user.id !== userId && session.user.role !== 'admin')) {
    throw new Error('User not found');
  }
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...safe } = user;
  return safe;
}

// Update the user's address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Authentication required' };

    const currentUser = await prisma.user.findFirst({
      where: { id: session.user.id },
    });

    if (!currentUser) throw new Error('User not found');

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { address },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update user's payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Authentication required' };
    const currentUser = await prisma.user.findFirst({
      where: { id: session.user.id },
    });

    if (!currentUser) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);
    if (!isPaymentMethodAvailable(paymentMethod.type)) throw new Error('That payment method is not available yet');

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.type },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update the user profile
export async function updateProfile(user: { name: string; email: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Authentication required' };

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!currentUser) throw new Error('User not found');

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: user.name,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all the users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  await requireAdmin();
  const queryFilter: Prisma.UserWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.user.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a user
export async function deleteUser(id: string) {
  await requireAdmin();
  try {
    await prisma.user.delete({ where: { id } });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  await requireAdmin();
  try {
    const parsed = updateUserSchema.parse(user);
    if (!USER_ROLES.includes(parsed.role)) return { success: false, message: 'Unsupported account role.' };
    await prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<{id:string;role:string}[]>`
        SELECT id,role FROM "User" WHERE id=${parsed.id}::uuid FOR UPDATE`;
      if (rows.length !== 1) throw new Error('User not found');
      await tx.user.update({ where: { id: parsed.id }, data: { name: parsed.name, role: parsed.role } });
      if (rows[0].role !== parsed.role) {
        await tx.$executeRaw`
          INSERT INTO "UserSessionVersion" ("userId","version") VALUES (${parsed.id}::uuid,1)
          ON CONFLICT ("userId") DO UPDATE SET "version"="UserSessionVersion"."version"+1,"updatedAt"=now()`;
      }
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch {
    return { success: false, message: 'User update could not be confirmed. Reload to check before retrying.' };
  }
}
