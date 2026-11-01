'use client';

import { useState } from 'react';

export default function EnquiryForm({ serviceSlug }: { serviceSlug: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErr('');
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'),
          email: f.get('email'),
          message: f.get('message'),
          website: f.get('website'),
          serviceSlug,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setStatus('sent');
      else {
        setErr(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErr('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'sent')
    return (
      <p role='status' className='rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800'>
        Thanks. Your enquiry is saved for the Omnistu team. We have not sent you an email confirmation.
      </p>
    );

  const input = 'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm';
  return (
    <form onSubmit={onSubmit} className='space-y-3' aria-label='Enquire about this service'>
      <h2 className='font-semibold'>Enquire about this</h2>
      <label className='block text-sm'>
        Name
        <input name='name' required minLength={2} maxLength={120} className={input} />
      </label>
      <label className='block text-sm'>
        Email
        <input name='email' type='email' required maxLength={254} className={input} />
      </label>
      <label className='block text-sm'>
        What do you need?
        <textarea name='message' required minLength={10} maxLength={5000} rows={4} className={input} />
      </label>
      <input name='website' tabIndex={-1} autoComplete='off' aria-hidden='true' className='hidden' />
      {status === 'error' && (
        <p role='alert' className='text-sm text-red-700'>
          {err}
        </p>
      )}
      <button
        type='submit'
        disabled={status === 'sending'}
        className='rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'
      >
        {status === 'sending' ? 'Sending...' : 'Send enquiry'}
      </button>
    </form>
  );
}
