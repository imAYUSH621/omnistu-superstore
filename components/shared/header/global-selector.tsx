'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLang } from '@/lib/i18n';

export default function GlobalSelector() {
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('EN');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read from localStorage on mount
    const savedLang = localStorage.getItem('omnistu_lang') as SupportedLang;
    if (savedLang && ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'].includes(savedLang)) {
      setSelectedLang(savedLang);
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangChange = (lang: SupportedLang) => {
    setSelectedLang(lang);
    localStorage.setItem('omnistu_lang', lang);
    document.cookie = `omnistu_lang=${lang}; path=/; max-age=31536000`;
    window.dispatchEvent(new CustomEvent('omnistu:lang-change', { detail: { lang } }));
  };


  const currentFlag = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.flag || '🇺🇸';

  return (
    <div className='relative' ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer text-white text-[13px] font-bold transition-colors select-none'
        aria-label='Select Language'
        aria-expanded={isOpen}
      >
        <span className='text-sm leading-none'>{currentFlag}</span>
        <span className='leading-none tracking-tight'>{selectedLang}</span>
        <ChevronDown className='w-3 h-3 text-[#a7acb2]' />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#1a202c] text-[#0f172a] dark:text-white rounded-sm shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-100'>
          {/* Language Section */}
          <div className='border-b border-neutral-200 dark:border-neutral-700 pb-2.5 mb-2.5'>
            <div className='flex items-center gap-1.5 mb-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
              <Globe className='w-3.5 h-3.5' />
              <span>Language Setting</span>
            </div>
            <div className='space-y-1'>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code as SupportedLang)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xs text-xs text-left transition-colors ${
                    selectedLang === lang.code
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  <span className='flex items-center gap-2'>
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {selectedLang === lang.code && <Check className='w-3.5 h-3.5 text-amber-600' />}
                </button>
              ))}
            </div>
            <p className='mt-2 text-[11px] leading-snug text-neutral-700 dark:text-neutral-200'>
              Only menus and checkout labels are translated. Product details and policy pages stay in English.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
