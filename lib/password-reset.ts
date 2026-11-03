import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/db/prisma';
import { bumpSessionVersion } from '@/lib/session-version';
import { hashPassword } from '@/lib/password';
import { resolveMailTransport } from '@/lib/mail/transport';

// Reset tokens live in the existing VerificationToken table, keyed by a
// prefixed identifier, and only the SHA-256 of the token is stored.
export const RESET_PREFIX = 'pwreset:';
export const RESET_TTL_MS = 60 * 60 * 1000;

export function newResetToken(): string {
  return randomBytes(32).toString('base64url');
}
export function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
export function resetIdentifier(email: string): string {
  return `${RESET_PREFIX}${email.trim().toLowerCase()}`;
}

/**
 * Creates a reset token for a known email and hands the link to the
 * configured mail transport (SMTP when its env exists, otherwise the dev
 * outbox). Returns nothing about whether the account exists.
 */
export type RequestOutcome = 'sent' | 'skipped' | 'failed';

export async function requestPasswordReset(emailInput: string, baseUrl: string): Promise<RequestOutcome> {
  // Nothing can deliver a link without a configured transport, so do not
  // mint tokens that nobody can receive.
  const transport = resolveMailTransport();
  if (!transport) return 'skipped';
  const email = emailInput.trim().toLowerCase();
  if (!email) return 'skipped';
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return 'skipped';
  const identifier = resetIdentifier(email);
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const raw = newResetToken();
  await prisma.verificationToken.create({
    data: { identifier, token: hashResetToken(raw), expires: new Date(Date.now() + RESET_TTL_MS) },
  });
  const link = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(raw)}`;
  let delivered = false;
  try {
    delivered = await transport.send({ to: email, subject: 'Reset your password', text: link });
  } catch {
    delivered = false;
  }
  if (!delivered) {
    // Nobody received the link, so the token must not stay valid.
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return 'failed';
  }
  return 'sent';
}

export type ResetResult = { ok: true } | { ok: false; reason: 'invalid' | 'expired' };

/** Single-use: the token row is deleted when consumed. */
export async function consumePasswordReset(rawToken: string, newPassword: string): Promise<ResetResult> {
  if (!rawToken) return { ok: false, reason: 'invalid' };
  const hashed = hashResetToken(rawToken);
  const row = await prisma.verificationToken.findFirst({
    where: { token: hashed, identifier: { startsWith: RESET_PREFIX } },
  });
  if (!row) return { ok: false, reason: 'invalid' };
  const deleted = await prisma.verificationToken.deleteMany({
    where: { identifier: row.identifier, token: hashed },
  });
  if (deleted.count !== 1) return { ok: false, reason: 'invalid' };
  if (row.expires.getTime() < Date.now()) return { ok: false, reason: 'expired' };
  const email = row.identifier.slice(RESET_PREFIX.length);
  const updated = await prisma.user.updateMany({
    where: { email },
    data: { password: await hashPassword(newPassword) },
  });
  if (updated.count !== 1) return { ok: false, reason: 'invalid' };
  const u = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (u) await bumpSessionVersion(u.id);
  return { ok: true };
}
