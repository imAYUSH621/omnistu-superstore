import { NextResponse } from 'next/server';
import { prisma, databaseConfigured } from '@/db/prisma';
import { classifyDatabase } from '@/lib/db-status';
import { catalogSource } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Health endpoint. Reports liveness + a coarse database classification:
 * ok | not_configured | down | schema_incomplete.
 * catalogSource says whether product reads use the database or the bundled sample
 * data (a connected DB with a localhost URL still serves the sample unless
 * ALLOW_LOCAL_DATABASE=1 is set for local testing).
 * No sensitive data: no counts, no config values, no env names.
 */
export async function GET() {
  const db = await classifyDatabase(databaseConfigured, (s, ...v) =>
    prisma.$queryRaw(s, ...v) as never
  );
  return NextResponse.json(
    { status: db === 'ok' ? 'ok' : 'degraded', db, catalogSource: catalogSource(), time: new Date().toISOString() },
    { status: db === 'ok' ? 200 : 503 }
  );
}
