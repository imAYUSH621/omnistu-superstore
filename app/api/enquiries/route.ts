import { NextResponse } from 'next/server';
import { prisma, databaseConfigured } from '@/db/prisma';
import { auth } from '@/auth';
import { rateLimited, validateEnquiry } from '@/lib/enquiries';

// Shared store support and service enquiry intake. The enquiry is stored in the database FIRST; that
// is the record. Email forwarding is not attempted here, so success means
// "saved for the team", never "emailed". If the database is not configured
// the endpoint says so (503) instead of pretending to have saved anything.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
  // Honeypot: real users never fill this hidden field. Pretend success.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).website) {
    return NextResponse.json({ success: true });
  }
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  const check = validateEnquiry(body);
  if (!check.ok) return NextResponse.json({ success: false, error: check.error }, { status: 400 });
  if (!databaseConfigured) {
    return NextResponse.json(
      { success: false, configured: false, error: 'Enquiries are not available yet. Please try again later.' },
      { status: 503 }
    );
  }
  // Link to the account only when the visitor is signed in right now. Guests
  // stay guests: no lookup or linking by email, so no history is attached to an
  // account without proof of ownership. A session lookup failure means guest.
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    userId = null;
  }
  try {
    await prisma.serviceEnquiry.create({ data: { ...check.value, userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[enquiries] save failed:', err instanceof Error ? err.name : 'error');
    return NextResponse.json({ success: false, error: 'Your enquiry could not be saved. Please try again later.' }, { status: 502 });
  }
}
