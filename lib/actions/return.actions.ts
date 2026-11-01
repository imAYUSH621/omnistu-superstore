'use server';

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

/**
 * Returns / RMA flow (G3). Simulation-only by design (2026-11-01):
 * - No payment provider refund calls are made anywhere in this module.
 * - Approving a return records refundStatus 'SIMULATED' and never claims
 *   money moved. Live provider refunds stay blocked until the owner
 *   supplies live keys AND approves the draft refund policy.
 * - Supplier-return handling is tracked as a status, not executed: when an
 *   order was dispatched via a supplier, the supplier RMA must be initiated
 *   manually until supplier API scope is settled.
 */

type ActionResult = { success: boolean; message: string; returnId?: string };

export async function requestReturn(orderId: string, reason: string): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, message: 'You must be signed in.' };
  if (!reason || reason.trim().length < 10) {
    return { success: false, message: 'Please describe the reason (at least 10 characters).' };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) {
    return { success: false, message: 'Order not found.' };
  }
  if (!order.isPaid) {
    return { success: false, message: 'Only paid orders can be returned.' };
  }

  const existing = await prisma.returnRequest.findFirst({
    where: { orderId, status: { in: ['REQUESTED', 'APPROVED'] } },
  });
  if (existing) {
    return { success: false, message: 'A return request already exists for this order.', returnId: existing.id };
  }

  const rr = await prisma.returnRequest.create({
    data: { orderId, userId, reason: reason.trim() },
  });
  return { success: true, message: 'Return requested. This is a demo store - the request is recorded but no refund is processed.', returnId: rr.id };
}

export async function reviewReturn(
  returnId: string,
  approve: boolean,
  note?: string
): Promise<ActionResult> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { success: false, message: 'Admin access required.' };

  const rr = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true },
  });
  if (!rr) return { success: false, message: 'Return request not found.' };
  if (rr.status !== 'REQUESTED') {
    return { success: false, message: `Return already ${rr.status.toLowerCase()}.` };
  }

  if (!approve) {
    await prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'REJECTED', resolutionNote: note?.trim() || null },
    });
    return { success: true, message: 'Return rejected.' };
  }

  // Approve = record a SIMULATED refund. No provider call, no money moves.
  const supplierNote = rr.order.dispatchSupplier
    ? 'Supplier RMA must be initiated manually - supplier return API scope not settled.'
    : null;
  await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: 'APPROVED',
      refundAmount: rr.order.totalPrice,
      refundStatus: 'SIMULATED',
      supplierReturnStatus: rr.order.dispatchSupplier ? 'PENDING_MANUAL' : 'NOT_REQUIRED',
      resolutionNote: [
        'Refund simulated only (test mode; no provider call, no money moved).',
        supplierNote,
        note?.trim(),
      ]
        .filter(Boolean)
        .join(' '),
    },
  });
  return {
    success: true,
    message: 'Return approved with a SIMULATED refund (test mode - no payment provider was called).',
    returnId,
  };
}

export async function getMyReturns(): Promise<{ success: boolean; data?: unknown[]; message?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, message: 'You must be signed in.' };
  const data = await prisma.returnRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { success: true, data };
}

export async function getAllReturns(): Promise<{ success: boolean; data?: unknown[]; message?: string }> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { success: false, message: 'Admin access required.' };
  const data = await prisma.returnRequest.findMany({
    include: {
      order: { select: { id: true, totalPrice: true, isPaid: true, dispatchSupplier: true, createdAt: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return { success: true, data: JSON.parse(JSON.stringify(data)) };
}
