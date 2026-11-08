import { NextResponse } from 'next/server';
import { prisma, databaseConfigured } from '@/db/prisma';
import {currentCustomer} from '@/lib/foundation/current-customer-server';
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
  // Shared account adapter uses only the authenticated existing User UUID.
  // A storage failure must not silently turn a signed-in enquiry into guest history.
  const identity=await currentCustomer();
  if(identity.status==='unavailable'||identity.status==='not-found')return NextResponse.json({success:false,error:'Your account could not be verified. Please try again later.'},{status:503});
  const userId=identity.status==='authenticated'?identity.customer.customerId:null;
  try {
    await prisma.serviceEnquiry.create({ data: { ...check.value, userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[enquiries] save failed:', err instanceof Error ? err.name : 'error');
    return NextResponse.json({ success: false, error: 'Your enquiry could not be saved. Please try again later.' }, { status: 502 });
  }
}
