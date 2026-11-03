'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';

export default function SearchInput() {
  const [placeholder, setPlaceholder] = useState(() => translate('EN', 'searchPlaceholder'));

  useEffect(() => {
    const apply = (lang: string) => setPlaceholder(translate(lang, 'searchPlaceholder'));
    const cookieMatch = document.cookie.match(/(?:^|;\s*)omnistu_lang=([^;]+)/);
    const saved = (cookieMatch ? decodeURIComponent(cookieMatch[1]) : null) || localStorage.getItem('omnistu_lang');
    if (saved) apply(saved);
    const onChange = (e: Event) => {
      const lang = (e as CustomEvent<{ lang: string }>).detail?.lang;
      if (lang) apply(lang);
    };
    window.addEventListener('omnistu:lang-change', onChange);
    return () => window.removeEventListener('omnistu:lang-change', onChange);
  }, []);

  return (
    <Input
      id='twotabsearchtextbox'
      name='q'
      type='text'
      placeholder={placeholder}
      className='flex-1 border-0 h-10 text-[14px] text-[#0f172a] placeholder:text-[#767676] focus-visible:ring-0 bg-white px-3 font-sans'
    />
  );
}
