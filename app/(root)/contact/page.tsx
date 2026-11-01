'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Package } from 'lucide-react';
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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          message: form.get('message'),
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
          This is a demo store in test mode. The fastest help channel right now is the on-site AI
          assistant (bottom-right of every page).
        </p>
      </div>

      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5'>
          <MessageCircle className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>AI Assistant</h2>
          <p className='text-xs text-muted-foreground'>
            Available on every page for product, order and policy questions.
          </p>
        </div>
        <Link
          href='/track'
          className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition'
        >
          <Package className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>Track an order</h2>
          <p className='text-xs text-muted-foreground'>Check the status of a demo order.</p>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className='rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4'>
        <div className='flex items-center gap-2'>
          <Mail className='w-5 h-5 text-amber-500' />
          <h2 className='font-semibold text-sm'>Email us</h2>
        </div>
        {status === 'sent' ? (
          <p className='text-sm text-emerald-600 dark:text-emerald-400 font-medium'>
            Message sent. We will reply to your email address.
          </p>
        ) : (
          <>
            <div className='grid sm:grid-cols-2 gap-4'>
              <label className='space-y-1 text-xs font-medium text-foreground'>
                Name
                <input
                  name='name'
                  required
                  minLength={2}
                  className='mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
                />
              </label>
              <label className='space-y-1 text-xs font-medium text-foreground'>
                Your email
                <input
                  name='email'
                  type='email'
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
              {status === 'sending' ? 'Sending...' : 'Send message'}
            </Button>
            <p className='text-[11px] text-muted-foreground'>
              Email support activates once the store&apos;s support mailbox is configured; until
              then this form tells you so instead of silently dropping your message.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
