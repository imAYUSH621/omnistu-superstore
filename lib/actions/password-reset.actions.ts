'use server';

import { z } from 'zod';
import { devOutboxEnabled } from '@/lib/dev-outbox';
import { consumePasswordReset, requestPasswordReset } from '@/lib/password-reset';

const emailSchema = z.string().trim().toLowerCase().email();
const GENERIC = 'If an account exists for that email, a reset link has been prepared in the development outbox.';
const UNAVAILABLE = 'Password reset is not available yet.';

export async function requestReset(_prev: unknown, formData: FormData) {
  if (!devOutboxEnabled()) return { success: false, message: UNAVAILABLE };
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (parsed.success) {
    try {
      await requestPasswordReset(parsed.data, process.env.NEXTAUTH_URL || 'http://localhost:3000');
    } catch (e) {
      console.warn('password reset request failed', e instanceof Error ? e.name : 'error');
    }
  }
  // Same reply for unknown emails, bad emails and failures.
  return { success: true, message: GENERIC };
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function resetPassword(_prev: unknown, formData: FormData) {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };
  const r = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (r.ok) return { success: true, message: 'Password updated. You can sign in now.' };
  return {
    success: false,
    message: r.reason === 'expired' ? 'This reset link has expired. Request a new one.' : 'This reset link is not valid. Request a new one.',
  };
}
