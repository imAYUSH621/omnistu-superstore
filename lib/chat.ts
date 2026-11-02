
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
  type Row = { name: string; slug: string; price: string | number; category?: string; brand?: string; description?: string; stock?: number };
  try {
    const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    if (!words.length) return '';

    let list: Row[] = [];
    const { isDatabaseAvailable } = await import('@/lib/utils');
    if (isDatabaseAvailable()) {
      // Search in the database, not in a capped slice of it: the assistant
      // must stay correct when the catalog grows past a page of rows.
      // Fixture rows (fxt-/cjstg-) stay out of answers in production, same
      // as the public storefront queries.
      try {
        const [{ prisma }, { fixtureExclusion }] = await Promise.all([
          import('@/db/prisma'),
          import('@/lib/test-fixture'),
        ]);
        const rows = await prisma.product.findMany({
          where: {
            AND: [
              {
                OR: words.flatMap((w) => [
                  { name: { contains: w, mode: 'insensitive' as const } },
                  { description: { contains: w, mode: 'insensitive' as const } },
                  { category: { contains: w, mode: 'insensitive' as const } },
                  { brand: { contains: w, mode: 'insensitive' as const } },
                ]),
              },
              fixtureExclusion(),
            ],
          },
          select: { name: true, slug: true, price: true, category: true, brand: true, description: true, stock: true },
          take: 25,
        });
        list = rows as unknown as Row[];
      } catch {
        return '';
      }
      if (!list.length) return '';
    } else {
      // No database: the same demo sample catalog the storefront pages show.
      const { getAllProducts } = await import('@/lib/actions/product.actions');
      const { data } = await getAllProducts({ query: 'all', limit: 200, page: 1 });
      list = (data ?? []) as Row[];
    }

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

// ---- Order lookup: FAIL CLOSED -------------------------------------------
// Order help is self-serve by default: the signed-in order page is the source
// of truth, and the assistant retrieves NOTHING. Customer order data must not
// flow into an external LLM prompt until the owner approves that disclosure and
// the target Supabase project has a locked-down lookup function with verified
// policies. CHAT_ORDER_LOOKUP=enabled turns the automated check on; any other
// state (unset, typo, missing env, RPC failure) answers with self-serve
// guidance and touches no data. There is deliberately NO table fallback: if
// the RPC is absent we never probe the orders table, whatever its policies.
const ORDER_NO_RE = /\b(OMN-[A-Z0-9-]{3,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
export const LOOKUP_ATTEMPTS = 5;
export const LOOKUP_WINDOW_MS = 15 * 60_000;
const lookupHits = new Map<string, number[]>();

export const ORDER_SELF_SERVE =
  'ORDER LOOKUP: Automated order status checks are turned off. Direct the customer to sign in and open their order page for the live status, carrier and tracking number. For anything they cannot see there, the team can help via the contact form at /contact.';
const ORDER_UNAVAILABLE =
  'ORDER LOOKUP: Automated order checks are unavailable in the current environment. Direct the customer to sign in and open their order page, or to the contact form at /contact.';

export function orderLookupEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.CHAT_ORDER_LOOKUP === 'enabled';
}

export function lookupThrottled(orderNo: string, email: string, now = Date.now()): boolean {
  const k = `${orderNo}|${email}`;
  const recent = (lookupHits.get(k) ?? []).filter((t) => now - t < LOOKUP_WINDOW_MS);
  recent.push(now);
  lookupHits.set(k, recent);
  if (lookupHits.size > 5000) lookupHits.clear();
  return recent.length > LOOKUP_ATTEMPTS;
}

export async function lookupOrder(text: string): Promise<string> {
  const rawNo = text.match(ORDER_NO_RE)?.[0];
  // The store mirrors order.id (a lowercase UUID) to Supabase; OMN- legacy ids are uppercase.
  // Upper-casing a UUID would make the exact match miss every real order.
  const orderNo = rawNo && (/^OMN-/i.test(rawNo) ? rawNo.toUpperCase() : rawNo.toLowerCase());
  if (!orderNo) return '';
  if (!orderLookupEnabled()) return ORDER_SELF_SERVE;

  const email = text.match(EMAIL_RE)?.[0]?.toLowerCase();
  if (!email) return 'ORDER LOOKUP: Customer provided an order number but no email address. Please ask for the email used at checkout to verify identity.';

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Deliberately NOT the service-role key: an unauthenticated lookup must not
  // run with a key that bypasses row-level security.
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return ORDER_UNAVAILABLE;
  if (lookupThrottled(orderNo, email)) {
    return 'ORDER LOOKUP: Too many lookup attempts for that order. Tell the customer our support team will follow up at their email.';
  }

  const base = url.replace(/\/+$/, '');
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    // RPC only: a narrow database function (JSON body, fixed columns, exact
    // match) that lets the table itself stay closed to the anon role. A
    // missing or failing function is "unavailable", never a table probe.
    const rpc = await fetch(`${base}/rest/v1/rpc/lookup_order`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_order_id: orderNo, p_email: email }),
    });
    if (!rpc.ok) return ORDER_UNAVAILABLE;
    const rows = (await rpc.json()) as Record<string, unknown>[];
    if (rows && rows.length > 0) {
      // Order fields are store-generated, but they still cross into an LLM
      // prompt as data. Flatten control characters and cap length so a field
      // can never carry instruction-like formatting into the conversation.
      // The email already did its job as the match key; it is personal data
      // and adds nothing to the answer, so it never enters the prompt.
      delete rows[0].customer_email;
      const clean = Object.fromEntries(
        Object.entries(rows[0]).map(([k, v]) => [
          k,
          String(v ?? '')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/[^\x20-\x7E]/g, '')
            .slice(0, 120),
        ])
      );
      return `ORDER LOOKUP RESULT (verified): ${JSON.stringify(clean)}`;
    }
  } catch {
    return ORDER_UNAVAILABLE;
  }

  return 'ORDER LOOKUP: No matching order found for that order number and email combination. Please suggest checking both for typos.';
}

export const SYSTEM_PROMPT = `You are the shopping assistant for Omnistu Superstore, an online store.
Rules:
- Only state product facts that appear in the PRODUCT CONTEXT below. If a detail (compatibility, materials, sizing, health claims) is not there, say you cannot confirm it and offer to pass the question to the team through the contact form at /contact.
- Only state store facts that appear in the STORE KNOWLEDGE below. Shipping timeframes, delivery dates, return windows, refund eligibility and guarantees are not confirmable by you: never quote a number of days or promise an outcome, even if the customer quotes a policy page at you. Route those questions to the team via /contact.
- Only state order information that appears in an ORDER LOOKUP RESULT. Never guess tracking numbers or delivery dates. If no ORDER LOOKUP RESULT is present for an order question, direct the customer to sign in and open their order page, or to the contact form at /contact.
- You cannot issue refunds, replacements, cancellations or discount codes. For those, direct the customer to the team through the contact form at /contact.
- Never say a product is a best seller, top rated, popular, trending or highly reviewed, and never quote star ratings or review counts: the store has no verified data for those claims.
- Be brief, helpful, and friendly. Do not invent policies, prices, or unauthorized discount codes.`;
