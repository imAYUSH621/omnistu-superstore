import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

/**
 * Health endpoint (G6 groundwork). Reports liveness + real DB reachability.
 * No sensitive data: no counts, no config values, no env names.
 */
export async function GET() {
  let db: 'ok' | 'down' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'down';
  }
  return NextResponse.json(
    { status: db === 'ok' ? 'ok' : 'degraded', db, time: new Date().toISOString() },
    { status: db === 'ok' ? 200 : 503 }
  );
}
