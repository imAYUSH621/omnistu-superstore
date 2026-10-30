import {
  MAX_MESSAGES,
  MAX_CHARS,
  PROVIDERS,
  ChatMessage,
  limited,
  findProducts,
  lookupOrder,
  SYSTEM_PROMPT,
} from '@/lib/chat';

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (limited(ip)) return new Response('Too many requests. Please wait a minute.', { status: 429 });

  const providerName = (process.env.LLM_PROVIDER === 'nvidia' ? 'nvidia' : 'groq') as keyof typeof PROVIDERS;
  const provider = PROVIDERS[providerName];
  const apiKey = provider.key();
  if (!apiKey) {
    return new Response('AI Concierge assistant is currently configuring keys. Please check back shortly.', { status: 503 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = (await req.json()) as { messages?: ChatMessage[] };
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return new Response('No message', { status: 400 });

  const recentUserText = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
  const [products, order] = await Promise.all([findProducts(lastUser.content), lookupOrder(recentUserText)]);

  const system = `${SYSTEM_PROMPT}\n\nPRODUCT CONTEXT:\n${products || '(no matching products found)'}\n\n${order}`;

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
