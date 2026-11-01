// Only same-site paths may be used as a post-login destination.
// Absolute URLs, protocol-relative URLs and backslash tricks fall back to '/'.
// An absolute URL on our own origin is reduced to its path.
export function safeCallbackPath(raw: unknown, origin?: string): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return '/';
  let v = raw.trim();
  if (/^https?:\/\//i.test(v)) {
    if (!origin) return '/';
    try {
      const u = new URL(v);
      if (u.origin !== new URL(origin).origin) return '/';
      v = u.pathname + u.search + u.hash;
    } catch {
      return '/';
    }
  }
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\') || /[\u0000-\u001f]/.test(v)) return '/';
  return v;
}
