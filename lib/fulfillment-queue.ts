import { prisma } from '@/db/prisma';

/**
 * G7: safe retry/exception queue for supplier fulfillment tasks.
 *
 * Design boundaries (2026-11-01):
 * - AUTONOMY OFF: nothing in this module runs on a schedule, cron, or timer.
 *   Processing happens only when an operator explicitly invokes
 *   processDueFulfillmentTasks with { allowRun: true }.
 * - NO PROVIDER CALLS: this module never imports the dispatcher or any
 *   supplier client and never performs network I/O. The caller supplies the
 *   runner that executes a task; test-mode runners must not call providers.
 * - Exceptions are captured, never lost: after maxAttempts the task becomes
 *   FAILED_EXCEPTION with lastError, visible for manual resolution.
 */

export const FULFILLMENT_QUEUE_AUTONOMY = false;
export const BASE_BACKOFF_MS = 60_000;
export const MAX_BACKOFF_MS = 60 * 60_000;

export function backoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts), MAX_BACKOFF_MS);
}

export async function enqueueFulfillmentTask(input: {
  orderId: string;
  supplier: string;
  payload: Record<string, unknown>;
  maxAttempts?: number;
  /** Optional transaction client: lets a caller record the task in the SAME transaction as another write. */
  tx?: Pick<typeof prisma, 'fulfillmentTask'>;
}): Promise<{ id: string; deduplicated: boolean }> {
  const db = input.tx ?? prisma;
  // One active task per order+supplier: a duplicate enqueue returns the
  // existing task instead of double-dispatching later.
  const existing = await db.fulfillmentTask.findFirst({
    where: { orderId: input.orderId, supplier: input.supplier, status: { in: ['PENDING', 'RETRYING'] } },
  });
  if (existing) return { id: existing.id, deduplicated: true };
  const task = await db.fulfillmentTask.create({
    data: {
      orderId: input.orderId,
      supplier: input.supplier,
      payload: input.payload,
      maxAttempts: input.maxAttempts ?? 5,
    },
  });
  return { id: task.id, deduplicated: false };
}

export async function recordTaskSuccess(taskId: string): Promise<void> {
  await prisma.fulfillmentTask.update({
    where: { id: taskId },
    data: { status: 'SUCCEEDED', lastError: null },
  });
}

export async function recordTaskFailure(
  taskId: string,
  error: string
): Promise<{ status: 'RETRYING' | 'FAILED_EXCEPTION'; nextAttemptAt?: Date }> {
  const task = await prisma.fulfillmentTask.findUniqueOrThrow({ where: { id: taskId } });
  const attempts = task.attempts + 1;
  if (attempts >= task.maxAttempts) {
    await prisma.fulfillmentTask.update({
      where: { id: taskId },
      data: { status: 'FAILED_EXCEPTION', attempts, lastError: error },
    });
    return { status: 'FAILED_EXCEPTION' };
  }
  const nextAttemptAt = new Date(Date.now() + backoffMs(attempts));
  await prisma.fulfillmentTask.update({
    where: { id: taskId },
    data: { status: 'RETRYING', attempts, lastError: error, nextAttemptAt },
  });
  return { status: 'RETRYING', nextAttemptAt };
}

export async function dueFulfillmentTasks(now = new Date(), limit = 20) {
  return prisma.fulfillmentTask.findMany({
    where: { status: { in: ['PENDING', 'RETRYING'] }, nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: 'asc' },
    take: limit,
  });
}

export type TaskRunner = (task: {
  id: string;
  orderId: string;
  supplier: string;
  payload: unknown;
}) => Promise<void>;

/**
 * Manual-only drain. Requires an explicit allowRun from the calling operator
 * flow; otherwise it is a no-op. The runner is supplied by the caller - this
 * module has no supplier knowledge and makes no provider calls itself.
 */
export async function processDueFulfillmentTasks(
  runner: TaskRunner,
  opts: { allowRun: boolean; limit?: number }
): Promise<{ skipped: boolean; reason?: string; processed: number; failed: number }> {
  if (FULFILLMENT_QUEUE_AUTONOMY) {
    return { skipped: true, reason: 'queue autonomy is compiled OFF', processed: 0, failed: 0 };
  }
  if (!opts.allowRun) {
    return { skipped: true, reason: 'manual allowRun required - the queue never self-runs', processed: 0, failed: 0 };
  }
  const due = await dueFulfillmentTasks(new Date(), opts.limit ?? 20);
  let processed = 0;
  let failed = 0;
  for (const task of due) {
    try {
      await runner(task);
      await recordTaskSuccess(task.id);
      processed += 1;
    } catch (err) {
      failed += 1;
      await recordTaskFailure(task.id, err instanceof Error ? err.message : String(err));
    }
  }
  return { skipped: false, processed, failed };
}
