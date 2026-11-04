import type { prisma } from '@/db/prisma';
type Tx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
export type CartSnapshot = { id: string; items: unknown[]; itemsPrice: string; shippingPrice: string; taxPrice: string; totalPrice: string };
/** Stable object-key order: PostgreSQL JSONB does not preserve input key order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',') + '}';
  return JSON.stringify(value);
}
export async function assertCheckoutSnapshot(tx: Tx, userId: string, expected: CartSnapshot) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`user:${userId}`}))`;
  const current = await tx.cart.findFirst({ where: { id: expected.id, userId } });
  if (!current || canonical(current.items) !== canonical(expected.items) ||
    (['itemsPrice','shippingPrice','taxPrice','totalPrice'] as const).some(k => Number(current[k]) !== Number(expected[k]))) {
    throw new Error('Your cart changed. Please review it before placing the order.');
  }
}
