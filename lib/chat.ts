
// ---- Config -------------------------------------------------------------
export const MAX_MESSAGES = 12;
export const MAX_CHARS = 1500;
export const RATE_LIMIT = 20; // requests
export const RATE_WINDOW_MS = 60_000;

export const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
  },
  nvidia: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    key: () => process.env.NVIDIA_API_KEY,
    model: 'meta/llama-3.3-70b-instruct',
  },
} as const;

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ---- Simple in-memory rate limit
const hits = new Map<string, number[]>();
export function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

// ---- Catalog grounding ----------------------------------------------------
// Products come from the same source as the store pages (database first, demo
// sample data only when there is no database), so a link from the assistant
// opens a real product page and the price matches it. Only name, category,
// brand and description are searched and quoted: ratings, review counts and
// badges are never used to rank or describe a product (they are unverified).
export async function findProducts(query: string): Promise<string> {
  try {
    const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    if (!words.length) return '';
    const { getAllProducts } = await import('@/lib/actions/product.actions');
    const { data } = await getAllProducts({ query: 'all', limit: 200, page: 1 });
    const list = (data ?? []) as { name: string; slug: string; price: string | number; category?: string; brand?: string; description?: string; stock?: number }[];
    const scored = list
      .map((p) => {
        const text = `${p.name} ${p.category ?? ''} ${p.brand ?? ''} ${p.description ?? ''}`.toLowerCase();
        return { p, score: words.filter((w) => text.includes(w)).length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored
      .map(({ p }) => {
        const stockNote = typeof p.stock === 'number' && p.stock <= 0 ? ' | currently out of stock' : '';
        return `- ${p.name} | price: $${Number(p.price).toFixed(2)}${stockNote} | link: /product/${p.slug}`;
      })
      .join('\n');
  } catch {
    return '';
  }
}

// ---- Order lookup: requires BOTH order number and the email on the order ---
// Exact match only (no partial id), identifiers constrained before they reach
// the query, never a bypass-RLS key, and a per-order/email attempt throttle.
const ORDER_NO_RE = /\b(OMN-[A-Z0-9-]{3,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
export const LOOKUP_ATTEMPTS = 5;
export const LOOKUP_WINDOW_MS = 15 * 60_000;
const lookupHits = new Map<string, number[]>();

export function lookupThrottled(orderNo: string, email: string, now = Date.now()): boolean {
  const k = `${orderNo}|${email}`;
  const recent = (lookupHits.get(k) ?? []).filter((t) => now - t < LOOKUP_WINDOW_MS);
  recent.push(now);
  lookupHits.set(k, recent);
  if (lookupHits.size > 5000) lookupHits.clear();
  return recent.length > LOOKUP_ATTEMPTS;
}

export function buildOrderLookupQuery(orderNo: string, email: string): URLSearchParams {
  return new URLSearchParams({
    select: 'order_id,customer_email,status,tracking_number,carrier,created_at',
    order_id: `eq.${orderNo}`,
    customer_email: `eq.${email}`,
    limit: '1',
  });
}

export async function lookupOrder(text: string): Promise<string> {
  const rawNo = text.match(ORDER_NO_RE)?.[0];
  // The store mirrors order.id (a lowercase UUID) to Supabase; OMN- legacy ids are uppercase.
  // Upper-casing a UUID would make the exact match miss every real order.
  const orderNo = rawNo && (/^OMN-/i.test(rawNo) ? rawNo.toUpperCase() : rawNo.toLowerCase());
  const email = text.match(EMAIL_RE)?.[0]?.toLowerCase();
  if (!orderNo) return '';
  if (!email) return 'ORDER LOOKUP: Customer provided an order number but no email address. Please ask for the email used at checkout to verify identity.';

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Deliberately NOT the service-role key: an unauthenticated lookup must not
  // run with a key that bypasses row-level security.
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return 'ORDER LOOKUP: Database connection unavailable in current environment. Tell the customer our support team will follow up at their email.';
  }
  if (lookupThrottled(orderNo, email)) {
    return 'ORDER LOOKUP: Too many lookup attempts for that order. Tell the customer our support team will follow up at their email.';
  }

  const base = url.replace(/\/+$/, '');
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    // Preferred: a narrow database function (JSON body, fixed columns, exact match) that lets the
    // table itself stay closed to the anon role. Falls back to the exact-match table query only
    // when the function does not exist yet (404), so the code is safe to ship before the DB change.
    const rpc = await fetch(`${base}/rest/v1/rpc/lookup_order`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_order_id: orderNo, p_email: email }),
    });
    let rows: Record<string, unknown>[] | null = null;
    if (rpc.ok) {
      rows = (await rpc.json()) as Record<string, unknown>[];
    } else if (rpc.status === 404 && (await isMissingLookupFunction(rpc))) {
      const res = await fetch(`${base}/rest/v1/orders?${buildOrderLookupQuery(orderNo, email)}`, { headers });
      if (res.ok) rows = (await res.json()) as Record<string, unknown>[];
    }
    if (rows && rows.length > 0) {
      return `ORDER LOOKUP RESULT (verified): ${JSON.stringify(rows[0])}`;
    }
  } catch {
    // fall through to the no-match message
  }

  return 'ORDER LOOKUP: No matching order found for that order number and email combination. Please suggest checking both for typos.';
}

export const SYSTEM_PROMPT = `You are the shopping assistant for Omnistu Superstore, an online store.
Rules:
- Only state product facts that appear in the PRODUCT CONTEXT below. If a detail (compatibility, materials, sizing, health claims) is not there, say you cannot confirm it and offer to pass the question to the support team.
- Only state order information that appears in an ORDER LOOKUP RESULT. Never guess tracking numbers or delivery dates.
- You cannot issue refunds, replacements or cancellations. For those, tell the customer our support team handles return authorizations and ask them to contact support@omnistu.com.
- Never say a product is a best seller, top rated, popular, trending or highly reviewed, and never quote star ratings or review counts: the store has no verified data for those claims.
- Be brief, helpful, and friendly. Do not invent policies, prices, or unauthorized discount codes.`;

/**
 * PostgREST answers PGRST202 ("could not find the function ... in the schema cache") when an RPC
 * does not exist. Only that exact case may fall back to the table query; any other 404 or error
 * must not trigger a data fallback.
 */
async function isMissingLookupFunction(res: Response): Promise<boolean> {
  try {
    const body = (await res.json()) as { code?: string; message?: string; details?: string };
    return body?.code === 'PGRST202' && `${body.message ?? ''} ${body.details ?? ''}`.includes('lookup_order');
  } catch {
    return false;
  }
}
