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

export type OversoldItem = { slug: string; name: string; stock: number };

/**
 * Admin-only, read-only. Products whose stock went below zero. Stock is only
 * decremented when an order is marked paid (cart add checks stock earlier), so
 * two shoppers can both pay for the last unit. What to do about it (refund,
 * backorder, re-source) is an owner decision; this only shows it.
 */
export async function getOversoldProducts(): Promise<{ success: true; items: OversoldItem[] } | { success: false; message: string }> {
  const session = await auth();
  if (session?.user?.role !== 'admin') return { success: false, message: 'User is not authorized' };
  try {
    const items = await prisma.product.findMany({
      where: { stock: { lt: 0 } },
      select: { slug: true, name: true, stock: true },
      orderBy: { stock: 'asc' },
      take: 100,
    });
    return { success: true, items };
  } catch (e) {
    console.error('[oversold] query failed:', e instanceof Error ? e.message : e);
    return { success: false, message: 'Could not load oversold products.' };
  }
}
