import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/db/prisma';
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
  const users = await prisma.user.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, take: 2, select: { id: true, email: true } });
  if (users.length !== 1) return 'skipped';
  const user = users[0];
  const identifier = resetIdentifier(email);
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const raw = newResetToken();
  await prisma.verificationToken.create({
    data: { identifier, token: hashResetToken(raw), expires: new Date(Date.now() + RESET_TTL_MS) },
  });
  const link = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(raw)}`;
  let delivered = false;
  try {
    delivered = await transport.send({ to: user.email, subject: 'Reset your password', text: link });
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

/** Token consumption, password change and old-session revocation commit together.
 * Hashing stays outside the transaction; token freshness is rechecked inside. */
export async function consumePasswordReset(rawToken: string, newPassword: string): Promise<ResetResult> {
  if (!rawToken) return { ok: false, reason: 'invalid' };
  const hashed = hashResetToken(rawToken);
  const candidate = await prisma.verificationToken.findFirst({
    where: { token: hashed, identifier: { startsWith: RESET_PREFIX } },
  });
  if (!candidate) return { ok: false, reason: 'invalid' };
  const password = await hashPassword(newPassword);
  return prisma.$transaction(async tx => {
    const row = await tx.verificationToken.findFirst({
      where: { token: hashed, identifier: candidate.identifier },
    });
    if (!row) return { ok: false, reason: 'invalid' } as const;
    const deleted = await tx.verificationToken.deleteMany({
      where: { identifier: row.identifier, token: hashed },
    });
    if (deleted.count !== 1) return { ok: false, reason: 'invalid' } as const;
    if (row.expires.getTime() < Date.now()) return { ok: false, reason: 'expired' } as const;
    const email = row.identifier.slice(RESET_PREFIX.length);
    const users = await tx.user.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, take: 2, select: { id: true } });
    if (users.length !== 1) return { ok: false, reason: 'invalid' } as const;
    const user = users[0];
    await tx.user.update({ where: { id: user.id }, data: { password } });
    // Do not use the best-effort legacy helper: failure MUST abort this reset.
    await tx.$executeRaw`
      INSERT INTO "UserSessionVersion" ("userId","version") VALUES (${user.id}::uuid, 1)
      ON CONFLICT ("userId") DO UPDATE SET "version" = "UserSessionVersion"."version" + 1, "updatedAt" = now()`;
    return { ok: true } as const;
  });
}
