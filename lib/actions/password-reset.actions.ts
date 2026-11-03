'use server';

import { authOrigin } from '@/lib/auth-origin';

import { after } from 'next/server';
import { z } from 'zod';
import { hitLimit, limitKey, LIMITS } from '@/lib/auth-limits';
import { resolveMailTransport } from '@/lib/mail/transport';
import { consumePasswordReset, requestPasswordReset } from '@/lib/password-reset';

const emailSchema = z.string().trim().toLowerCase().email();
const GENERIC_OUTBOX = 'If an account exists for that email, a reset link has been prepared in the development outbox.';
const GENERIC_SENT = 'If an account exists for that email, reset instructions will be sent shortly.';
const UNAVAILABLE = 'Password reset is not available yet.';

export async function requestReset(_prev: unknown, formData: FormData) {
  const transport = resolveMailTransport();
  if (!transport) return { success: false, message: UNAVAILABLE };
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (parsed.success) {
    const lim = await hitLimit('reset-req', parsed.data, LIMITS.resetRequest.max, LIMITS.resetRequest.windowSec);
    if (lim.allowed) {
      // Runs after the response is sent, so reply timing cannot reveal whether the
      // account exists or how long delivery took. The outcome (sent | skipped |
      // failed) never reaches the public reply: failed delivery revokes the token
      // and logs only an error name.
      const origin = authOrigin() || 'http://localhost:3000';
      after(async () => {
        try {
          await requestPasswordReset(parsed.data, origin);
        } catch (e) {
          console.warn('password reset request failed', e instanceof Error ? e.name : 'error');
        }
      });
    }
  }
  return { success: true, message: transport.kind === 'smtp' ? GENERIC_SENT : GENERIC_OUTBOX };
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
  const lim = await hitLimit('reset-use', limitKey(parsed.data.token), LIMITS.resetUse.max, LIMITS.resetUse.windowSec);
  if (!lim.allowed) return { success: false, message: 'Too many attempts. Try again later.' };
  const r = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (r.ok) return { success: true, message: 'Password updated. You can sign in now.' };
  return {
    success: false,
    message: r.reason === 'expired' ? 'This reset link has expired. Request a new one.' : 'This reset link is not valid. Request a new one.',
  };
}
