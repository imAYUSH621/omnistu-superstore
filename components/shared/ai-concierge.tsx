'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Sparkles, X, MessageSquare, Send } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

const GREETING: Msg = {
  role: 'assistant',
  content: 'Hello! I am the Omnistu Shopping Assistant. Ask me about any product in our catalog or check your order status (please provide both your Order ID and checkout email).',
};

export default function AiConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });

      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: acc }]);
        endRef.current?.scrollIntoView({ block: 'end' });
      }
    } catch {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: 'Sorry, I am temporarily unable to answer. Please contact support@omnistu.com for direct assistance.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close shopping assistant' : 'Open 24/7 shopping assistant'}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2 px-4 py-3 bg-[#131921] hover:bg-[#232f3e] text-white rounded-full shadow-xl border border-[#febd69]/40 transition-all transform hover:scale-105 select-none font-['Amazon_Ember',Arial,sans-serif]"
      >
        <Sparkles className="w-4 h-4 text-[#febd69]" />
        <span className="text-[13px] font-bold">{open ? 'Close Assistant' : 'AI Assistant'}</span>
      </button>

      {/* Slideout Chat Modal */}
      {open && (
        <div
          role="dialog"
          aria-label="Omnistu Shopping Assistant"
          className="fixed right-5 bottom-20 z-50 w-[360px] max-w-[calc(100vw-32px)] h-[480px] flex flex-col bg-white dark:bg-[#131921] text-[#0f1111] dark:text-white border border-[#d0d5dd] dark:border-[#37475a] rounded-xl shadow-2xl overflow-hidden font-['Amazon_Ember',Arial,sans-serif]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#131921] text-white border-b border-[#232f3e]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#febd69]" />
              <span className="font-bold text-[14px]">Omnistu Concierge</span>
              <span className="text-[11px] bg-[#febd69]/20 text-[#febd69] px-2 py-0.5 rounded-full font-medium">24/7 Live</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition p-1"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#f8f9fa] dark:bg-[#0f1111]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#131921] border border-[#febd69]/50 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-[#febd69]" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#131921] text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-[#1a232f] text-[#0f1111] dark:text-[#ddd] border border-[#eaeded] dark:border-[#232f3e] rounded-bl-none shadow-xs'
                  }`}
                >
                  {m.content || (
                    <span className="inline-flex gap-1 items-center text-gray-400">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={send} className="flex items-center gap-2 p-2.5 bg-white dark:bg-[#131921] border-t border-[#eaeded] dark:border-[#232f3e]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products or tracking..."
              maxLength={500}
              disabled={busy}
              className="flex-1 px-3 py-2 text-[13px] bg-[#f8f9fa] dark:bg-[#1f2937] border border-[#d0d5dd] dark:border-[#37475a] rounded-lg focus:outline-none focus:border-[#febd69] dark:text-white"
            />
            <button
              disabled={busy || !input.trim()}
              type="submit"
              className="px-3.5 py-2 bg-[#febd69] hover:bg-[#f3a847] disabled:opacity-50 text-[#131921] rounded-lg font-bold text-[13px] transition flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
