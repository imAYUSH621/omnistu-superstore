import { randomUUID } from 'node:crypto';
import { prisma } from '@/db/prisma';
import { bindRetailLine, type RetailSnapshot } from '@/lib/retail/snapshot';
import { addQualifiedItem, readQualifiedCart, createQualifiedTestOrder, payQualifiedTestOrder, listQualifiedOptions, removeQualifiedItem } from '@/lib/retail/store';
const RUN = process.env.QUALIFIED_RETAIL_NATIVE_TEST === 'true' && /^postgresql:\/\/[^@]+@127\.0\.0\.1:55444\/omnistu_test_qualified_release\?/.test(process.env.DATABASE_URL || '');
(RUN ? describe : describe.skip)('ordinary Store qualified variant transaction integration', () => {
  let userId: string, otherId: string, productId: string;
  const offers: {lineKey:string;snapshotId:string;variantId:string}[] = [];
  beforeAll(async () => {
    process.env.QUALIFIED_RETAIL_TEST_CHECKOUT = 'true'; process.env.TEST_CHECKOUT_MODE = 'true';
    userId = (await prisma.user.create({ data: { email: `qualified-${randomUUID()}@example.invalid`, name: 'Local customer', role: 'user', paymentMethod: 'TestPayment', address: { fullName: 'Local Customer', streetAddress: 'Test address only', city: 'Test City', country: 'US', postalCode: '10001' } } })).id;
    otherId = (await prisma.user.create({ data: { email: `qualified-${randomUUID()}@example.invalid`, name: 'Other local customer', role: 'user', address: { country: 'US', postalCode: '10001' } } })).id;
    productId = (await prisma.product.create({ data: { name: 'Local shirt', slug: `local-shirt-${randomUUID()}`, category: 'Local apparel', description: 'Disposable transaction fixture', images: ['/images/placeholder.svg'], price: 0, stock: 0 } })).id;
    for (const label of ['Blue / M', 'Brown / L']) {
      const v = await prisma.productVariant.create({ data: { productId, sku: randomUUID(), name: label } });
      const snapshot: RetailSnapshot = { version: 1, productId, variantId: v.id, provider: 'local-test', providerProductId: 'local-shirt', providerVariantId: v.id, warehouseId: 'local-warehouse', destinationCountry: 'US', destinationPostal: '10001', quoteId: randomUUID(), quoteRevision: '1', retailUnitCents: 1000, currency: 'USD', supplierUnitCents: 100, shippingQuoteCents: 200, freightQuotedQty: 2, shippingMethod: 'local-test', availableQty: 2, observedAt: new Date().toISOString(), validUntil: new Date(Date.now() + 600000).toISOString(), retailApprovalSource: 'LOCAL FIXTURE ONLY', stockSource: 'LOCAL FIXTURE ONLY', shippingSource: 'LOCAL FIXTURE ONLY' };
      const line = bindRetailLine(snapshot, 1, new Date(), 600000);
      await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(snapshot)}::jsonb,${productId}::uuid,${v.id}::uuid)`;
      await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(snapshot)}::jsonb,${productId}::uuid,${v.id}::uuid,2,true)`;
      offers.push({lineKey:line.lineKey,snapshotId:line.snapshotId,variantId:v.id});
    }
  });
  afterAll(async () => { delete process.env.QUALIFIED_RETAIL_TEST_CHECKOUT; delete process.env.TEST_CHECKOUT_MODE; await prisma.$disconnect(); });
  it('ordinary user sees safe option labels and exact retail prices, without supplier or source details', async () => {
    const options = await listQualifiedOptions(userId, productId);
    expect(options.map(o => o.label)).toEqual(['Blue / M', 'Brown / L']);
    expect(options.every(o => o.price === '10.00')).toBe(true);
    expect(JSON.stringify(options)).not.toMatch(/supplierUnitCents|stockSource|warehouseId|providerVariantId|retailApprovalSource/);
  });
  it('two variants of the same product survive one cart, one order and one simulated payment', async () => {
    await Promise.all(offers.map(o => addQualifiedItem(userId, {lineKey:o.lineKey,snapshotId:o.snapshotId,qty:1})));
    const cart = (await readQualifiedCart(userId))!;
    expect(cart.lines).toHaveLength(2); expect(cart.total).toBe('20.00');
    const input = {cartId:cart.id,reviewToken:cart.reviewToken,idempotencyKey:randomUUID()};
    const orderId = await createQualifiedTestOrder(userId,input);
    expect(await createQualifiedTestOrder(userId,input)).toBe(orderId);
    await expect(payQualifiedTestOrder(otherId,orderId)).rejects.toThrow('Own qualified');
    expect(await payQualifiedTestOrder(userId,orderId)).toEqual({alreadyPaid:false});
    expect(await payQualifiedTestOrder(userId,orderId)).toEqual({alreadyPaid:true});
    expect((await prisma.order.findUniqueOrThrow({where:{id:orderId}}))).toMatchObject({isPaid:true,paymentMethod:'TestPayment',dispatchStatus:'TEST_ONLY'});
    expect(await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "productId"=${productId}::uuid ORDER BY "lineKey"`).toEqual([{availableQty:1},{availableQty:1}]);
    expect(await prisma.$queryRaw`SELECT qty,state FROM "RetailAllocation" WHERE "orderId"=${orderId}::uuid`).toEqual([{qty:1,state:'CONSUMED'},{qty:1,state:'CONSUMED'}]);
    expect((await prisma.product.findUniqueOrThrow({where:{id:productId}})).stock).toBe(0);
    expect((await readQualifiedCart(userId))!.lines).toHaveLength(0);
  });
  it('cross-user removal and unreviewed quote changes refuse without changing the cart', async () => {
    const o=offers[0];await addQualifiedItem(userId,{lineKey:o.lineKey,snapshotId:o.snapshotId,qty:1});
    const cart=(await readQualifiedCart(userId))!;
    await expect(removeQualifiedItem(otherId,{cartId:cart.id,lineKey:o.lineKey,snapshotId:o.snapshotId})).rejects.toThrow('Cart not found');
    await prisma.productVariant.update({where:{id:o.variantId},data:{name:'Changed option copy'}});
    await expect(createQualifiedTestOrder(userId,{cartId:cart.id,reviewToken:cart.reviewToken,idempotencyKey:randomUUID()})).rejects.toThrow('Cart details changed');
    expect((await readQualifiedCart(userId))!.lines).toHaveLength(1);
    await removeQualifiedItem(userId,{cartId:cart.id,lineKey:o.lineKey,snapshotId:o.snapshotId});
  });
  it('immutable quote versions reject SQL edits',async()=>{await expect(prisma.$executeRaw`UPDATE "RetailQuote" SET snapshot=snapshot WHERE "snapshotId"=${offers[0].snapshotId}`).rejects.toThrow('immutable')});
});
