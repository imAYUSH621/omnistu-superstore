import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// No analytics source exists yet. This used to return invented revenue,
// keyword and view numbers; it now says so instead.
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: false, message: 'Analytics are not available yet.' }, { status: 501 });
}
