'use server';

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { findPaidOrdersNeedingAttention, type ReconcileItem } from '@/lib/paid-reconciliation';

/** Admin-only, read-only. Lists paid orders whose dispatch record is missing or not complete. */
export async function getPaidOrderReconciliation(): Promise<
  { success: true; items: ReconcileItem[] } | { success: false; message: string }
> {
  const session = await auth();
  if (session?.user?.role !== 'admin') return { success: false, message: 'User is not authorized' };
  try {
    const items = await findPaidOrdersNeedingAttention(prisma as never);
    return { success: true, items };
  } catch (e) {
    console.error('[reconciliation] query failed:', e instanceof Error ? e.message : e);
    return { success: false, message: 'Could not load the reconciliation list. Try again; the database may be unreachable.' };
  }
}
