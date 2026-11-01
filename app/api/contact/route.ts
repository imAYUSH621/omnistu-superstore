import { NextResponse } from 'next/server';

// Contact intake. Honest by construction: until email sending is
// configured (RESEND_API_KEY), the endpoint tells the caller support is
// not reachable by email yet instead of pretending a message was
// delivered. Never claims delivery it cannot perform.
//
// Recipient: team@omnistu.com, the owner's confirmed store contact inbox
// (Ayush, 2026-11-01). SUPPORT_EMAIL overrides it if ops ever want a
// different inbox. The From identity stays env-gated (SENDER_EMAIL)
// pending Resend domain verification - no sender claim is made here.

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
  if (!resendKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Email support is not configured yet. Please use the on-site AI assistant or try again later.',
        configured: false,
      },
      { status: 503 }
    );
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: `Omnistu Superstore <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
      to: [supportEmail],
      replyTo: email.trim(),
      subject: `[Contact] ${name.trim()}`,
      text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact] Failed to forward message:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: 'Your message could not be sent right now. Please try again later.' },
      { status: 502 }
    );
  }
}
