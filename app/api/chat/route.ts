import { requestSupportLanguage } from '@/lib/support-language';
import { groundedSupportAnswer, retrieveStoreHelp } from '@/lib/grounded-support';
import {
  MAX_MESSAGES,
  MAX_CHARS,
  PROVIDERS,
  ChatMessage,
  limited,
  SYSTEM_PROMPT,
} from '@/lib/chat';
import{buildStoreModelContext,storeModelEnabled}from '@/lib/store-model-context';

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

  const rawMessages=body.messages.filter(m=>m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string').slice(-MAX_MESSAGES).map(m=>({role:m.role,content:m.content.slice(0,MAX_CHARS)}));
  const currentUser=[...rawMessages].reverse().find(m=>m.role==='user');
  if(!currentUser)return new Response('No message',{status:400});
  // A stored key or legacy test flag alone never activates an external model.
  // Public, test and dormant-model paths use the same knowledge boundary.
  if(!apiKey||!storeModelEnabled()){
   const answer=await groundedSupportAnswer(currentUser.content,requestSupportLanguage(req));
   return new Response(answer,{status:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  }

  const lastUser=currentUser;

  const retrieval=await retrieveStoreHelp(lastUser.content,requestSupportLanguage(req));
  // Policies, account/shopping workflows, empty and unavailable catalog reads
  // are answered verbatim by the same application facts, never improvised.
  if(retrieval.intent!=='product'||retrieval.status!=='available'||!retrieval.catalogData){
   return new Response(retrieval.answer,{status:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  }
  const system=SYSTEM_PROMPT+'\n'+buildStoreModelContext(retrieval);

  const upstream = await fetch(provider.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      stream: true,
      temperature: 0.3,
      max_tokens: 500,
      messages: [{ role: 'system', content: system }, {role:'user',content:lastUser.content}],
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
