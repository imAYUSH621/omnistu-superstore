'use client';

import { useEffect, useState } from 'react';
import { translate, type DictionaryKey, type SupportedLang } from '@/lib/i18n';

/**
 * Renders the English string on the server and swaps to the selected
 * language after mount (and on language change), so SSR and hydration
 * always match. Anything without a translation falls back to English.
 */
export default function T({ k, className }: { k: DictionaryKey; className?: string }) {
  const [text, setText] = useState(() => translate('EN', k));

  useEffect(() => {
    const apply = (lang: string) => setText(translate(lang, k));
    const saved = localStorage.getItem('omnistu_lang');
    if (saved) apply(saved);
    const onChange = (e: Event) => {
      const lang = (e as CustomEvent<{ lang: SupportedLang }>).detail?.lang;
      if (lang) apply(lang);
    };
    window.addEventListener('omnistu:lang-change', onChange);
    return () => window.removeEventListener('omnistu:lang-change', onChange);
  }, [k]);

  return <span className={className}>{text}</span>;
}
