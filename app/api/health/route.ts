import { NextResponse } from 'next/server';
import { prisma, databaseConfigured } from '@/db/prisma';
import { classifyDatabase } from '@/lib/db-status';
import { isDatabaseAvailable } from '@/lib/utils';
import { hiddenSlugPrefixes, sampleCatalogAllowed } from '@/lib/test-fixture';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Health endpoint. Reports liveness + a coarse database classification:
 * ok | not_configured | down | schema_incomplete | auth_tables_missing.
 * catalogSource is what the storefront ACTUALLY serves, not config presence:
 *   'database'      - at least one publicly visible (non-fixture) product row
 *   'demo-fallback' - the bundled sample catalog is being served (allowed
 *                     outside the public production runtime only)
 *   'empty'         - database reachable but no publicly visible rows; the
 *                     storefront shows its honest empty state
 *   'unavailable'   - database not reachable/configured and no demo allowed
 * No sensitive data: no counts, no config values, no env names (a boolean
 * visibility probe, never a row count).
 */
export async function GET() {
  const db = await classifyDatabase(databaseConfigured, (s, ...v) =>
    prisma.$queryRaw(s, ...v) as never
  );
  let source: string;
  if (!isDatabaseAvailable()) {
    source = sampleCatalogAllowed() ? 'demo-fallback' : 'unavailable';
  } else if (db !== 'ok') {
    source = 'unavailable';
  } else {
    let visible = false;
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
      for (const p of hiddenSlugPrefixes()) {
        conditions.push(Prisma.sql`slug NOT LIKE ${p + '%'}`);
      }
      const rows = await prisma.$queryRaw<Array<{ x: boolean }>>`
        SELECT EXISTS(SELECT 1 FROM "Product" WHERE ${Prisma.join(conditions, ' AND ')}) AS x`;
      visible = rows[0]?.x === true;
    } catch {
      visible = false;
    }
    source = visible ? 'database' : sampleCatalogAllowed() ? 'demo-fallback' : 'empty';
  }
  return NextResponse.json(
    { status: db === 'ok' ? 'ok' : 'degraded', db, catalogSource: source, time: new Date().toISOString() },
    { status: db === 'ok' ? 200 : 503 }
  );
}
