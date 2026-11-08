'use client';

import { useState } from 'react';
import { useStoreLanguage } from '@/hooks/use-store-language';
import { CONTACT_COPY } from '@/lib/support-language';
import { Inbox, MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const language = useStoreLanguage();
  const copy = CONTACT_COPY[language];
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorText('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          message: form.get('message'),
          website: form.get('website'),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('sent');
      } else {
        setErrorText(res.status === 429 ? copy.rate : res.status === 503 ? copy.unavailable : res.status === 400 ? copy.invalid : copy.error);
        setStatus('error');
      }
    } catch {
      setErrorText(copy.network);
      setStatus('error');
    }
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-10 space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-foreground'>{copy.title}</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          {copy.intro}
        </p>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5'>
          <MessageCircle className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>{copy.helpTitle}</h2>
          <p className='text-xs text-muted-foreground'>
            {copy.help}
          </p>
        </div>
        <Link
          href='/track'
          className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition'
        >
          <Package className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>{copy.trackTitle}</h2>
          <p className='text-xs text-muted-foreground'>{copy.track}</p>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4'>
        <div className='flex items-center gap-2'>
          <Inbox className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>{copy.formTitle}</h2>
        </div>
        {status === 'sent' ? (
          <p role='status' className='text-sm text-emerald-600 dark:text-emerald-400 font-medium'>
            {copy.receipt}
          </p>
        ) : (
          <>
            <input name='website' type='text' tabIndex={-1} autoComplete='off' aria-hidden='true' className='hidden' />
            <div className='grid sm:grid-cols-2 gap-4'>
              <label className='space-y-1 text-xs font-medium text-foreground'>
                {copy.name}
                <input
                  name='name'
                  required
                  minLength={2}
                  maxLength={120}
                  className='mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
                />
              </label>
              <label className='space-y-1 text-xs font-medium text-foreground'>
                {copy.email}
                <input
                  name='email'
                  type='email'
                  maxLength={254}
                  required
                  className='mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
                />
              </label>
            </div>
            <label className='block space-y-1 text-xs font-medium text-foreground'>
              {copy.message}
              <textarea
                name='message'
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                className='mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
              />
            </label>
            {status === 'error' && (
              <p role='alert' className='text-sm text-destructive'>{errorText}</p>
            )}
            <Button
              type='submit'
              disabled={status === 'sending'}
              className='bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold rounded-full px-6'
            >
              {status === 'sending' ? copy.saving : copy.save}
            </Button>
            <p className='text-[11px] text-muted-foreground'>
              {copy.privacy} {copy.account}{' '}
              <Link href='/user/enquiries' className='underline'>{copy.history}</Link>.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
