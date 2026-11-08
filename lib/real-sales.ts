import { Prisma } from '@prisma/client';

/** Simulated receipts are never real paid sales. Preserve their records while
 * excluding the explicit test method and retained simulation markers. NULL
 * notes/dispatch status are normal on real orders, not reasons to omit them. */
export const realPaidOrderWhere: Prisma.OrderWhereInput = {
  isPaid: true,
  paymentMethod: { not: 'TestPayment' },
  AND: [
    { OR: [{ paymentNote: null }, { NOT: { paymentNote: { startsWith: 'QUALIFIED TEST ONLY' } } }] },
    { OR: [{ dispatchStatus: null }, { dispatchStatus: { not: 'TEST_ONLY' } }] },
  ],
};

export const realPaidOrderSql = Prisma.sql`"isPaid" = true
  AND "paymentMethod" <> 'TestPayment'
  AND ("paymentNote" IS NULL OR "paymentNote" NOT LIKE 'QUALIFIED TEST ONLY%')
  AND ("dispatchStatus" IS NULL OR "dispatchStatus" <> 'TEST_ONLY')`;
