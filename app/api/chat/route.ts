import { requestSupportLanguage } from '@/lib/support-language';
import { groundedSupportAnswer } from '@/lib/grounded-support';
import {
  MAX_MESSAGES,
  MAX_CHARS,
  PROVIDERS,
  ChatMessage,
  limited,
  findProducts,
  lookupOrder,
  SYSTEM_PROMPT,
  deterministicTestAnswer,
} from '@/lib/chat';
import { findStoreKnowledge } from '@/lib/store-knowledge';

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (limited(ip)) return new Response('Too many requests. Please wait a minute.', { status: 429 });

  // The owner selected NVIDIA and rejected Groq. Never implicitly select Groq,
  // even if an unrelated legacy GROQ_API_KEY exists in the environment.
  const provider = PROVIDERS.nvidia;
  const apiKey = provider.key();

  let body: { messages?: ChatMessage[] };
  try {
    body = (await req.json()) as { messages?: ChatMessage[] };
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body || typeof body !== 'object' || !Array.isArray(body.messages)) return new Response('Invalid messages', { status: 400 });

  if (!apiKey) {
    // Deterministic grounded TEST mode: rule-based answers over live store
    // data, clearly labeled, nothing sent to any external model. Explicit
    // opt-in via ASSISTANT_TEST_MODE; otherwise public grounded help below uses no external model.
    if (process.env.ASSISTANT_TEST_MODE === 'true') {
      const raw = (body.messages ?? [])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-MAX_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
      const lastTestUser = [...raw].reverse().find((m) => m.role === 'user');
      if (!lastTestUser) return new Response('No message', { status: 400 });
      const answer = await deterministicTestAnswer(lastTestUser.content);
      return new Response(answer, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUser = [...messages].reverse().find(m => m?.role === 'user' && typeof m.content === 'string');
    if (!lastUser) return new Response('No message', { status: 400 });
    const answer = await groundedSupportAnswer(lastUser.content.slice(0, MAX_CHARS), requestSupportLanguage(req));
    return new Response(answer, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  const messages = (body.messages ?? [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return new Response('No message', { status: 400 });

  const recentUserText = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
  const [products, order] = await Promise.all([findProducts(lastUser.content), lookupOrder(recentUserText)]);
  const knowledge = findStoreKnowledge(recentUserText);

  const system = `${SYSTEM_PROMPT}\n\nSTORE KNOWLEDGE:\n${knowledge || '(no store knowledge matched)'}\n\nPRODUCT CONTEXT:\n${products || '(no matching products found)'}\n\n${order}`;

  const upstream = await fetch(provider.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      stream: true,
      temperature: 0.3,
      max_tokens: 500,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Assistant temporarily unavailable. Please try again or contact support.', { status: 502 });
  }

  // Convert SSE stream into plain text stream
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            /* ignore partial JSON */
          }
        }
      },
    }),
  );

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
