'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  type SupportedLang,
} from '@/lib/i18n';

export default function GlobalSelector() {
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('EN');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read from localStorage on mount
    const savedLang = localStorage.getItem('omnistu_lang') as SupportedLang;
    if (savedLang && ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'].includes(savedLang)) {
      setSelectedLang(savedLang);
    }
    const savedCurr = localStorage.getItem('omnistu_currency');
    if (savedCurr && SUPPORTED_CURRENCIES[savedCurr]) {
      setSelectedCurrency(savedCurr);
    }

    // Hydrate dynamic live rates from market API
    fetch('/api/rates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rates) {
          window.dispatchEvent(
            new CustomEvent('omnistu:rates-updated', { detail: { rates: data.rates } })
          );
        }
      })
      .catch(() => {});

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

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    localStorage.setItem('omnistu_currency', curr);
    document.cookie = `omnistu_currency=${curr}; path=/; max-age=31536000`;
    window.dispatchEvent(new CustomEvent('omnistu:currency-change', { detail: { currency: curr } }));
  };

  const currentFlag = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.flag || '🇺🇸';
  const currCfg = SUPPORTED_CURRENCIES[selectedCurrency] || SUPPORTED_CURRENCIES.USD;

  return (
    <div className='relative' ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer text-white text-[13px] font-bold transition-colors select-none'
        aria-label='Select Language and Currency'
        aria-expanded={isOpen}
      >
        <span className='text-sm leading-none'>{currentFlag}</span>
        <span className='leading-none tracking-tight'>{selectedLang}</span>
        <span className='text-[11px] text-[#febd69] font-normal ml-0.5'>{currCfg.code}</span>
        <ChevronDown className='w-3 h-3 text-[#a7acb2]' />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#1a202c] text-[#0F1111] dark:text-white rounded-sm shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-100'>
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
          </div>

          {/* Currency Section */}
          <div>
            <div className='mb-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
              Currency Setting
            </div>
            <div className='grid grid-cols-2 gap-1'>
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCurrencyChange(c.code)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-xs text-xs text-left transition-colors ${
                    selectedCurrency === c.code
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent'
                  }`}
                >
                  <span>
                    <strong className='font-semibold'>{c.symbol}</strong> {c.code}
                  </span>
                  {selectedCurrency === c.code && <Check className='w-3 h-3 text-amber-600' />}
                </button>
              ))}
            </div>
          </div>

          <div className='mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 text-center'>
            Global real-time currency conversion applied site-wide
          </div>
        </div>
      )}
    </div>
  );
}
