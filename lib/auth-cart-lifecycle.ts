import { prisma } from '@/db/prisma';
/** Do not choose a lossy merge policy: when both carts contain items, preserve both and report conflict. */
export async function transferGuestCart(userId: string, sessionCartId: string) {
  return prisma.$transaction(async tx => {
    // Guest and signed-in writers each have an identity. Acquire both in stable order.
    for (const identity of [`guest:${sessionCartId}`, `user:${userId}`].sort()) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${identity}))`;
    }
    const guest = await tx.cart.findFirst({ where: { sessionCartId, userId: null } });
    if (!guest) return 'NO_GUEST' as const;
    const existing = await tx.cart.findMany({ where: { userId } });
    if (existing.some(c => c.items.length > 0) && guest.items.length > 0) return 'PRESERVED_CONFLICT' as const;
    if (existing.some(c => c.items.length > 0)) return 'KEPT_USER_CART' as const;
    // Only empty existing carts are removed. Never delete a cart with a buyer's items.
    if (existing.length) await tx.cart.deleteMany({ where: { id: { in: existing.map(c => c.id) }, userId } });
    await tx.cart.update({ where: { id: guest.id }, data: { userId } });
    return 'TRANSFERRED' as const;
  }, {maxWait:15000,timeout:15000});
}
export async function deleteUserCartForSignout(userId: string) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`user:${userId}`}))`;
    await tx.cart.deleteMany({ where: { userId } });
  });
}
/** Boolean notice only. Guest contents never cross this boundary into the signed-in cart. */
export async function hasPreservedGuestCart(userId: string, sessionCartId: string): Promise<boolean> {
  const [owned, guest] = await Promise.all([
    prisma.cart.findFirst({where:{userId},select:{items:true}}),
    prisma.cart.findFirst({where:{userId:null,sessionCartId},select:{items:true}}),
  ]);
  return !!owned?.items.length && !!guest?.items.length;
}
