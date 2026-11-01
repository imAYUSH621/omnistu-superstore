import { NextResponse } from 'next/server';
import { prisma, databaseConfigured } from '@/db/prisma';
import { classifyDatabase } from '@/lib/db-status';

export const dynamic = 'force-dynamic';

/**
 * Health endpoint. Reports liveness + a coarse database classification:
 * ok | not_configured | down | schema_incomplete.
 * No sensitive data: no counts, no config values, no env names.
 */
export async function GET() {
  const db = await classifyDatabase(databaseConfigured, (s, ...v) =>
    prisma.$queryRaw(s, ...v) as never
  );
  return NextResponse.json(
    { status: db === 'ok' ? 'ok' : 'degraded', db, time: new Date().toISOString() },
    { status: db === 'ok' ? 200 : 503 }
  );
}
