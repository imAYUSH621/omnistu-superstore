import { readFile } from 'node:fs/promises';
import path from 'node:path';

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
export async function findProducts(query: string): Promise<string> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'public/data/catalog_unified.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    let list: Record<string, unknown>[] = [];
    if (Array.isArray(parsed)) {
      list = parsed as Record<string, unknown>[];
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if ('products' in obj && Array.isArray(obj.products)) {
        list = obj.products as Record<string, unknown>[];
      } else {
        list = Object.values(obj) as Record<string, unknown>[];
      }
    }

    const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    if (!words.length) return '';
    const scored = list
      .map((p) => {
        const text = JSON.stringify(p).toLowerCase();
        return { p, score: words.filter((w) => text.includes(w)).length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored
      .map(({ p }) => {
        const title = String(p.title ?? p.name ?? 'Product');
        const price = String(p.price ?? 'n/a');
        const linkId = String(p.slug ?? p.asin ?? p.id ?? '');
        return `- ${title} | price: ${price} | link: /product/${linkId}`;
      })
      .join('\n');
  } catch {
    return '';
  }
}

// ---- Order lookup: requires BOTH order number and the email on the order ---
export async function lookupOrder(text: string): Promise<string> {
  const orderNo = text.match(/\b(OMN-[A-Z0-9-]{3,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i)?.[0]?.toUpperCase();
  const email = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0]?.toLowerCase();
  if (!orderNo) return '';
  if (!email) return 'ORDER LOOKUP: Customer provided an order number but no email address. Please ask for the email used at checkout to verify identity.';
  
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return 'ORDER LOOKUP: Database connection unavailable in current environment. Tell the customer our support team will follow up at their email.';
  }

  // 1. Try querying orders table (standard REST schema)
  try {
    const qs = new URLSearchParams({
      select: 'order_id,customer_email,status,tracking_number,carrier,created_at',
      or: `(order_id.eq.${orderNo},order_id.ilike.%${orderNo}%)`,
      customer_email: `eq.${email}`,
      limit: '1',
    });
    const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/orders?${qs}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const rows = (await res.json()) as Record<string, unknown>[];
      if (rows && rows.length > 0) {
        return `ORDER LOOKUP RESULT (verified): ${JSON.stringify(rows[0])}`;
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Try querying Prisma 'Order' table
  try {
    const qsPrisma = new URLSearchParams({
      select: 'id,totalPrice,isPaid,isDelivered,createdAt',
      id: `eq.${orderNo}`,
      limit: '1',
    });
    const resPrisma = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/Order?${qsPrisma}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (resPrisma.ok) {
      const rowsPrisma = (await resPrisma.json()) as Record<string, unknown>[];
      if (rowsPrisma && rowsPrisma.length > 0) {
        return `ORDER LOOKUP RESULT (verified): ${JSON.stringify(rowsPrisma[0])}`;
      }
    }
  } catch {
    // Continue
  }

  return 'ORDER LOOKUP: No matching order found for that order number and email combination. Please suggest checking both for typos.';
}

export const SYSTEM_PROMPT = `You are the shopping assistant for Omnistu Superstore, an online store.
Rules:
- Only state product facts that appear in the PRODUCT CONTEXT below. If a detail (compatibility, materials, sizing, health claims) is not there, say you cannot confirm it and offer to pass the question to the support team.
- Only state order information that appears in an ORDER LOOKUP RESULT. Never guess tracking numbers or delivery dates.
- You cannot issue refunds, replacements or cancellations. For those, tell the customer our support team handles return authorizations and ask them to contact support@omnistu.com.
- Be brief, helpful, and friendly. Do not invent policies, prices, or unauthorized discount codes.`;
