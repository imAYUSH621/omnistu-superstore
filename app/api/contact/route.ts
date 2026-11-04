import { resolveMailTransport } from '@/lib/mail/transport';
import { NextResponse } from 'next/server';

// Uses the existing configured SMTP/dev-outbox transport first, otherwise the legacy Resend path.
// No environment/credential activation. Provider acceptance is not inbox delivery.
// Recipient team@omnistu.com was confirmed by the owner; SUPPORT_EMAIL may override it.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, message } = (body ?? {}) as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ success: false, error: 'Please provide your name.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000) {
    return NextResponse.json(
      { success: false, error: 'Message must be between 10 and 5000 characters.' },
      { status: 400 }
    );
  }

  const supportEmail = process.env.SUPPORT_EMAIL || 'team@omnistu.com';
  const resendKey = process.env.RESEND_API_KEY;
  const transport = resolveMailTransport();
  if (transport) {
    const accepted = await transport.send({ to: supportEmail, subject: `[Contact] ${name.trim()}`, text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}` });
    return accepted ? NextResponse.json({ success: true }) : NextResponse.json({ success: false, error: 'Your message could not be accepted right now. Please try again later.' }, { status: 502 });
  }
  if (!resendKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Email support is not configured yet. Please try again later. Automated store help cannot send a message for you.',
        configured: false,
      },
      { status: 503 }
    );
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: `Omnistu Superstore <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
      to: [supportEmail],
      replyTo: email.trim(),
      subject: `[Contact] ${name.trim()}`,
      text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
    });
    if (result.error || !result.data?.id) return NextResponse.json({ success: false, error: 'Your message could not be accepted right now. Please try again later.' }, { status: 502 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact] Message transport failed:', err instanceof Error ? err.name : 'error');
    return NextResponse.json(
      { success: false, error: 'Your message could not be sent right now. Please try again later.' },
      { status: 502 }
    );
  }
}
