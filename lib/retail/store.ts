import {createHash} from 'node:crypto';
import { prisma } from '@/db/prisma';
import type { Prisma } from '@prisma/client';
import { qualifiedRetailTestEnabled } from './gate';
import { bindRetailLine, assertRetailLineCurrent, type BoundRetailLine } from './snapshot';
import { addStoredRetailCartLineTx, createRetailSimulationOrderTx, retailCartReviewToken } from './transactions';

const MAX_AGE_MS = 10 * 60 * 1000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type CartRow = { id: string; createdAt:Date; lines: BoundRetailLine[]; destinationCountry: string; destinationPostal: string };
type SafeLine = { productId: string; variantId: string; lineKey: string; snapshotId: string; name: string; variantLabel: string; slug: string; image: string; qty: number; price: string; status: 'current' | 'review' };
async function requireEnabled(userId: string) {
  if (!qualifiedRetailTestEnabled() || !uuid.test(userId)) throw Error('Qualified test checkout is unavailable');
  if(process.env.NODE_ENV==='production') {
    const expected=process.env.QUALIFIED_RETAIL_RUNTIME_ROLE;
    if(!expected)throw Error('Qualified runtime configuration required');
    const rows=await prisma.$queryRaw<{role:string;unsafe:boolean;readQuote:boolean;updateQty:boolean}[]>`
      SELECT current_user::text role,
       (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR session_user<>current_user
        OR EXISTS(SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid)
        OR EXISTS(SELECT 1 FROM pg_class c WHERE c.oid IN(to_regclass('"RetailQuote"'),to_regclass('"RetailOffer"')) AND c.relowner=r.oid)
        OR has_schema_privilege(r.oid,current_schema(),'CREATE')
        OR has_table_privilege(r.oid,to_regclass('"RetailQuote"'),'INSERT,UPDATE,DELETE')
        OR has_table_privilege(r.oid,to_regclass('"RetailOffer"'),'INSERT,DELETE')
        OR has_column_privilege(r.oid,to_regclass('"RetailOffer"'),'snapshot','UPDATE')
        OR has_column_privilege(r.oid,to_regclass('"RetailOffer"'),'snapshotId','UPDATE')
        OR has_column_privilege(r.oid,to_regclass('"RetailOffer"'),'published','UPDATE')
        OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT IN('pg_catalog','information_schema') AND p.prosecdef AND has_function_privilege(r.oid,p.oid,'EXECUTE'))
       ) unsafe,
       has_table_privilege(r.oid,to_regclass('"RetailQuote"'),'SELECT') "readQuote",
       has_column_privilege(r.oid,to_regclass('"RetailOffer"'),'availableQty','UPDATE') "updateQty"
      FROM pg_roles r WHERE r.rolname=current_user`;
    if(rows.length!==1||rows[0].role!==expected||rows[0].unsafe!==false||rows[0].readQuote!==true||rows[0].updateQty!==true)throw Error('Unqualified customer runtime');
  }
}
class DestinationRequiredError extends Error {}
function destination(address: unknown) {
  const a = address as { country?: unknown; postalCode?: unknown; fullName?:unknown;streetAddress?:unknown;city?:unknown;state?:unknown } | null;
  if (!a || typeof a.country !== 'string' || !/^[A-Z]{2}$/.test(a.country) || typeof a.postalCode !== 'string' || !a.postalCode.trim()) throw new DestinationRequiredError('Save a two-letter country code and postal code before choosing an offer');
  const addressBinding=createHash('sha256').update(JSON.stringify([a.fullName,a.streetAddress,a.city,a.state,a.country,a.postalCode])).digest('hex');
  return { country: a.country, postal: a.postalCode.trim(),addressBinding };
}
async function ownerDestination(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { address: true } });
  return destination(user?.address);
}
/** Public display projection excludes supplier costs, provider/warehouse IDs and private source references. */
export async function listQualifiedOptions(userId: string, productId: string) {
  await requireEnabled(userId);
  if (!uuid.test(productId)) return [];
  const d = await ownerDestination(userId);
  const rows = await prisma.$queryRaw<{ lineKey: string; snapshotId: string; snapshot: unknown; availableQty: number; label: string; variantId: string }[]>`
    SELECT o."lineKey",o."snapshotId",o.snapshot,o."availableQty",v.name AS label,v.id AS "variantId"
    FROM "RetailOffer" o JOIN "ProductVariant" v ON v.id=o."variantId" AND v."productId"=o."productId"
    WHERE o.published=true AND o."productId"=${productId}::uuid ORDER BY v.name,v.id`;
  return rows.flatMap(row => {
    try {
      const b = bindRetailLine(row.snapshot, 1, new Date(), MAX_AGE_MS);
      if (b.lineKey !== row.lineKey || b.snapshotId !== row.snapshotId || b.snapshot.productId !== productId || b.snapshot.variantId !== row.variantId || b.snapshot.destinationCountry !== d.country || b.snapshot.destinationPostal !== d.postal || !Number.isSafeInteger(row.availableQty) || row.availableQty <= 0 || !row.label.trim()) return [];
      return [{ lineKey: b.lineKey, snapshotId: b.snapshotId, variantId: row.variantId, label: row.label, price: (b.snapshot.retailUnitCents / 100).toFixed(2), maxQty: Math.min(row.availableQty, b.snapshot.freightQuotedQty) }];
    } catch { return []; }
  });
}
/** Keep missing destination, a confirmed empty result and a failed lookup distinct.
 * Never expose runtime/database diagnostics or weaken the existing test-only gate. */
export async function loadQualifiedOptions(userId:string,productId:string){
 try{return{status:'available' as const,options:await listQualifiedOptions(userId,productId)}}
 catch(error){return{status:error instanceof DestinationRequiredError?'destination-required' as const:'unavailable' as const,options:[]}}
}
export async function addQualifiedItem(userId: string, input: { lineKey: string; snapshotId: string; qty: number }) {
  await requireEnabled(userId);
  const d = await ownerDestination(userId);
  return prisma.$transaction(tx => addStoredRetailCartLineTx(tx, { userId, lineKey: input.lineKey, expectedSnapshotId: input.snapshotId, qty: input.qty, destinationCountry: d.country, destinationPostal: d.postal, now: new Date(), maxAgeMs: MAX_AGE_MS }));
}
export async function readQualifiedCart(userId: string) {
  await requireEnabled(userId);
  try {return await readQualifiedCartWithClient(prisma, userId, await ownerDestination(userId));} catch(error) {if(error instanceof DestinationRequiredError)return null;throw error;}
}
async function readQualifiedCartWithClient(db: Pick<typeof prisma, '$queryRaw'>, userId: string, d: {country:string;postal:string;addressBinding:string}) {
  const carts = await db.$queryRaw<CartRow[]>`SELECT * FROM "RetailCart" WHERE "userId"=${userId}::uuid AND "destinationCountry"=${d.country} AND "destinationPostal"=${d.postal}`;
  if (carts.length !== 1) return null;
  const cart = carts[0], lines: SafeLine[] = [];
  for (const line of cart.lines) {
    const rows = await db.$queryRaw<{ snapshot: unknown; snapshotId: string; availableQty: number; name: string; label: string; slug: string; images: string[] }[]>`
      SELECT o.snapshot,o."snapshotId",o."availableQty",p.name,p.slug,p.images,v.name AS label FROM "RetailOffer" o
      JOIN "Product" p ON p.id=o."productId" JOIN "ProductVariant" v ON v.id=o."variantId" AND v."productId"=p.id WHERE o."lineKey"=${line.lineKey} AND o.published=true`;
    let current = false;
    try { if (rows.length === 1 && rows[0].snapshotId === line.snapshotId && rows[0].availableQty >= line.qty) { assertRetailLineCurrent(line, rows[0].snapshot, { productId: line.snapshot.productId, variantId: line.snapshot.variantId, destinationCountry: d.country, destinationPostal: d.postal, now: new Date(), maxAgeMs: MAX_AGE_MS }); current = true; } } catch { /* Stale or unverifiable lines cannot check out. */ }
    lines.push({ productId: line.snapshot.productId, variantId: line.snapshot.variantId, lineKey: line.lineKey, snapshotId: line.snapshotId, name: rows[0]?.name || 'Product needs review', variantLabel: rows[0]?.label || 'Option needs review', slug: rows[0]?.slug || '', image: rows[0]?.images[0] || '/images/placeholder.svg', qty: line.qty, price: current ? (line.snapshot.retailUnitCents / 100).toFixed(2) : '', status: current ? 'current' : 'review' });
  }
  const totalCents = cart.lines.reduce((n, l) => n + l.snapshot.retailUnitCents * l.qty, 0);
  return { id: cart.id,createdAt:cart.createdAt, lines, reviewToken: createHash('sha256').update(JSON.stringify({binding:retailCartReviewToken(cart),display:lines,addressBinding:d.addressBinding})).digest('hex'), total: lines.every(l => l.status === 'current') && Number.isSafeInteger(totalCents) ? (totalCents / 100).toFixed(2) : null, country: d.country, postal: d.postal };
}
export async function removeQualifiedItem(userId: string, input: { cartId: string; lineKey: string; snapshotId: string }) {
  await requireEnabled(userId);
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`retail-cart:${userId}`}))`;
    const rows = await tx.$queryRaw<CartRow[]>`SELECT * FROM "RetailCart" WHERE id=${input.cartId}::uuid AND "userId"=${userId}::uuid FOR UPDATE`;
    const cart = rows[0]; if (!cart) throw Error('Cart not found');
    const selected = cart.lines.find(l => l.lineKey === input.lineKey);
    if (!selected || selected.snapshotId !== input.snapshotId) throw Error('Cart changed; refresh before removing');
    await tx.$executeRaw`UPDATE "RetailCart" SET lines=${JSON.stringify(cart.lines.filter(l => l.lineKey !== input.lineKey))}::jsonb WHERE id=${cart.id}::uuid`;
  });
}
export async function createQualifiedTestOrder(userId: string, input: { cartId: string; reviewToken: string; idempotencyKey: string }) {
  await requireEnabled(userId);
  if (!uuid.test(input.cartId) || !uuid.test(input.idempotencyKey) || !/^[a-f0-9]{64}$/.test(input.reviewToken)) throw Error('Current checkout review is required');
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`retail-cart:${userId}`}))`;
    const existing = await tx.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) { if (existing.userId !== userId) throw Error('Checkout key is unavailable'); return existing.id; }
    const user = await tx.user.findUnique({ where: { id: userId }, select: { address: true, paymentMethod: true } });
    const d = destination(user?.address);
    if (user?.paymentMethod !== 'TestPayment') throw Error('Choose simulated TestPayment first');
    const carts = await tx.$queryRaw<CartRow[]>`SELECT * FROM "RetailCart" WHERE id=${input.cartId}::uuid AND "userId"=${userId}::uuid FOR UPDATE`;
    if (carts.length !== 1 || carts[0].destinationCountry !== d.country || carts[0].destinationPostal !== d.postal) throw Error('Destination changed; review checkout again');
    const review = await readQualifiedCartWithClient(tx, userId, d);
    if (!review || review.id !== input.cartId || review.reviewToken !== input.reviewToken || review.total === null) throw Error('Cart details changed; review again');
    const orderId = await createRetailSimulationOrderTx(tx, { userId, cartId: input.cartId, displayLines: review.lines as unknown as Prisma.InputJsonValue, expectedReviewToken: retailCartReviewToken(carts[0]), shippingAddress: user!.address as Prisma.InputJsonValue, now: new Date(), maxAgeMs: MAX_AGE_MS });
    await tx.order.update({ where: { id: orderId }, data: { idempotencyKey: input.idempotencyKey } });
    return orderId;
  });
}
/** TESTONLY payment uses the exact retained quote. It never invokes legacy payment
 * settlement, mail, supplier routing or delivery code. */
export async function payQualifiedTestOrder(userId: string, orderId: string) {
  await requireEnabled(userId);
  return prisma.$transaction(async tx => {
    const orders = await tx.$queryRaw<{ userId: string; isPaid: boolean; paymentMethod: string; totalPrice: string }[]>`SELECT "userId","isPaid","paymentMethod","totalPrice"::text FROM "Order" WHERE id=${orderId}::uuid FOR UPDATE`;
    const order = orders[0];
    if (!order || order.userId !== userId || order.paymentMethod !== 'TestPayment') throw Error('Own qualified test order required');
    const rows = await tx.$queryRaw<{ lines: BoundRetailLine[]; state: string; amountCents: bigint; destinationCountry: string; destinationPostal: string }[]>`SELECT * FROM "RetailCheckout" WHERE "orderId"=${orderId}::uuid FOR UPDATE`;
    const checkout = rows[0];
    if (!checkout) throw Error('Qualified checkout not found');
    if (checkout.state === 'SIMULATED_PAID' && order.isPaid) return { alreadyPaid: true };
    if (checkout.state !== 'CREATED' || order.isPaid || Number(checkout.amountCents) !== Math.round(Number(order.totalPrice) * 100)) throw Error('Checkout needs review');
    for (const line of [...checkout.lines].sort((a, b) => a.lineKey.localeCompare(b.lineKey))) {
      const offers = await tx.$queryRaw<{ snapshot: unknown; snapshotId: string; availableQty: number }[]>`SELECT snapshot,"snapshotId","availableQty" FROM "RetailOffer" WHERE "lineKey"=${line.lineKey} AND published=true FOR UPDATE`;
      if (offers.length !== 1 || offers[0].snapshotId !== line.snapshotId || !Number.isSafeInteger(offers[0].availableQty) || offers[0].availableQty < line.qty) throw Error('Offer changed; payment refused');
      assertRetailLineCurrent(line, offers[0].snapshot, { productId: line.snapshot.productId, variantId: line.snapshot.variantId, destinationCountry: checkout.destinationCountry, destinationPostal: checkout.destinationPostal, now: new Date(), maxAgeMs: MAX_AGE_MS });
      await tx.$executeRaw`INSERT INTO "RetailOrderLine"("orderId","lineKey","snapshotId",snapshot,qty) VALUES(${orderId}::uuid,${line.lineKey},${line.snapshotId},${JSON.stringify(line.snapshot)}::jsonb,${line.qty})`;
      const changed = await tx.$executeRaw`UPDATE "RetailOffer" SET "availableQty"="availableQty"-${line.qty} WHERE "lineKey"=${line.lineKey} AND "availableQty">=${line.qty}`;
      if (changed !== 1) throw Error('Availability changed');
      await tx.$executeRaw`INSERT INTO "RetailAllocation"("orderId","lineKey","snapshotId",qty,state) VALUES(${orderId}::uuid,${line.lineKey},${line.snapshotId},${line.qty},'CONSUMED')`;
    }
    const captureId = `SIMULATED-CAPTURE-${orderId}`;
    await tx.order.update({ where: { id: orderId }, data: { isPaid: true, paidAt: new Date(), dispatchStatus: 'TEST_ONLY', paymentResult: { id: `SIMULATED-${orderId}`, captureId, status: 'SIMULATED', email_address: '', pricePaid: order.totalPrice } } });
    await tx.$executeRaw`UPDATE "RetailCheckout" SET state='SIMULATED_PAID',"captureId"=${captureId} WHERE "orderId"=${orderId}::uuid`;
    return { alreadyPaid: false };
  });
}
/** Retained buyer copy only. Caller has already checked order ownership. */
export async function qualifiedOrderItems(orderId: string) {
  const rows = await prisma.$queryRaw<{displayLines:SafeLine[]}[]>`SELECT "displayLines" FROM "RetailCheckout" WHERE "orderId"=${orderId}::uuid`;
  if (rows.length !== 1 || !Array.isArray(rows[0].displayLines)) throw Error('Qualified receipt unavailable');
  return rows[0].displayLines.map(line => ({ lineKey:line.lineKey, productId: line.productId, orderId, supplierLineKey:null,supplierSnapshotId:null,supplierSnapshot:null, name: `${line.name} (${line.variantLabel})`, slug: line.slug, image: line.image, qty: line.qty, price: line.price }));
}
