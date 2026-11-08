'use client';

import { useState } from 'react';
import { Inbox, MessageCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
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
        setErrorText(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorText('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-10 space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-foreground'>Contact &amp; Support</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Automated store help can guide you to products and your order page. To contact the team,
          use the form below to save an enquiry in the store support inbox. No email is sent.
        </p>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5'>
          <MessageCircle className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>Automated store help</h2>
          <p className='text-xs text-muted-foreground'>
            Basic product and order-page guidance. It cannot send messages, inspect your orders or confirm policy terms.
          </p>
        </div>
        <Link
          href='/track'
          className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition'
        >
          <Package className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>Track an order</h2>
          <p className='text-xs text-muted-foreground'>See where to find your order status.</p>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4'>
        <div className='flex items-center gap-2'>
          <Inbox className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>Send an enquiry</h2>
        </div>
        {status === 'sent' ? (
          <p className='text-sm text-emerald-600 dark:text-emerald-400 font-medium'>
            Your enquiry was saved in the store support inbox. No email was sent and no reply time is promised.
          </p>
        ) : (
          <>
            <input name='website' type='text' tabIndex={-1} autoComplete='off' aria-hidden='true' className='hidden' />
            <div className='grid sm:grid-cols-2 gap-4'>
              <label className='space-y-1 text-xs font-medium text-foreground'>
                Name
                <input
                  name='name'
                  required
                  minLength={2}
                  maxLength={120}
                  className='mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
                />
              </label>
              <label className='space-y-1 text-xs font-medium text-foreground'>
                Your email
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
              Message
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
              <p className='text-sm text-destructive'>{errorText}</p>
            )}
            <Button
              type='submit'
              disabled={status === 'sending'}
              className='bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold rounded-full px-6'
            >
              {status === 'sending' ? 'Saving...' : 'Save enquiry'}
            </Button>
            <p className='text-[11px] text-muted-foreground'>
              Only what you enter here is saved, not your chat history. Do not include passwords,
              payment details or other sensitive information. Signed-in enquiries appear in{' '}
              <Link href='/user/enquiries' className='underline'>My enquiries</Link>. Guest enquiries
              are not linked to an account by email.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
