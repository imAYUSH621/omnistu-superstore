import { SERVICES } from '@/lib/services-catalog';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EnquiryInput = { name: string; email: string; message: string; serviceSlug: string | null };
export type EnquiryCheck = { ok: true; value: EnquiryInput } | { ok: false; error: string };

/** Pure validation. Service slug must be a known catalog slug or absent. */
export function validateEnquiry(body: unknown): EnquiryCheck {
  const b = (body ?? {}) as Record<string, unknown>;
  const { name, email, message, serviceSlug } = b;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120)
    return { ok: false, error: 'Please provide your name.' };
  if (typeof email !== 'string' || email.trim().length > 254 || !EMAIL_RE.test(email.trim()))
    return { ok: false, error: 'Please provide a valid email address.' };
  if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000)
    return { ok: false, error: 'Message must be between 10 and 5000 characters.' };
  let slug: string | null = null;
  if (serviceSlug !== undefined && serviceSlug !== null && serviceSlug !== '') {
    if (typeof serviceSlug !== 'string' || !SERVICES.some((s) => s.slug === serviceSlug))
      return { ok: false, error: 'Unknown service.' };
    slug = serviceSlug;
  }
  return { ok: true, value: { name: name.trim(), email: email.trim(), message: message.trim(), serviceSlug: slug } };
}

// Small in-memory limiter: best effort per server instance only (serverless
// instances do not share it). It slows casual spam; it is not a guarantee.
const hits = new Map<string, number[]>();
export function rateLimited(key: string, now = Date.now(), max = 5, windowMs = 10 * 60 * 1000): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}
