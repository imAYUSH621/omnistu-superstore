import {readFileSync} from 'node:fs';
const mockAuth=jest.fn();const mockCreatePayPal=jest.fn();const mockCapturePayPal=jest.fn();
jest.mock('@/auth',()=>({auth:(...a:unknown[])=>mockAuth(...a)}));
jest.mock('@/lib/payment-capabilities',()=>({isPaymentMethodAvailable:()=>true,testCheckoutMode:()=>false}));
jest.mock('@/lib/paypal',()=>({paypal:{environment:'live',createOrder:(...a:unknown[])=>mockCreatePayPal(...a),capturePayment:(...a:unknown[])=>mockCapturePayPal(...a)}}));
import {createPayPalOrder,approvePayPalOrder} from '@/lib/actions/order.actions';
import {POST as operatorFulfillment} from '@/app/api/fulfillment/route';
import {dispatchOrderFulfillment} from '@/lib/fulfillment-dispatcher';
import {dispatchPersistedSupplierOrder,cjPayloadFromSupplierPlan} from '@/lib/bound-supplier-dispatch';
import {prepareSupplierBoundOrderTx} from '@/lib/supplier-checkout-preparation';
import {retailCartReviewToken} from '@/lib/retail/transactions';
import {validateSupplierPaymentPlanTx} from '@/lib/supplier-order-plan';
jest.mock('@/email',()=>({sendPurchaseReceipt:jest.fn()}));
jest.mock('@/lib/mailer',()=>({sendOrderConfirmationEmail:jest.fn(async()=>undefined)}));
jest.mock('@/lib/providers/supabase-sync',()=>({syncOrderToSupabase:jest.fn(async()=>undefined)}));
jest.mock('next/cache',()=>({revalidatePath:jest.fn()}));
import {updateOrderToPaid} from '@/lib/order-settlement';
import {localDatabaseTestEnabled} from './helpers/local-database';
import {randomUUID} from 'node:crypto';
import {prisma} from '@/db/prisma';
import {bindRetailLine,type RetailSnapshot} from '@/lib/retail/snapshot';
import {persistSupplierOrderPlanTx,loadSupplierOrderPlanTx} from '@/lib/supplier-order-plan';
const suite=localDatabaseTestEnabled()?describe:describe.skip;
suite('persisted supplier order binding on disposable real Postgres; no providers',()=>{
 let preparedOrderId:string;let userId:string,orderId:string,line:ReturnType<typeof bindRetailLine>;const now=new Date();const maxAgeMs=600000;
 const shipping={fullName:'Synthetic buyer',streetAddress:'Fixture only',city:'Fixture City',state:'NY',postalCode:'10001',country:'US',phone:'synthetic-not-a-number'};
 beforeAll(async()=>{
  userId=(await prisma.user.create({data:{email:`binding-${randomUUID()}@example.invalid`,name:'Synthetic only',password:'not-a-login'}})).id;
  const p=await prisma.product.create({data:{name:'Synthetic line',slug:`binding-itest-${randomUUID()}`,category:'test',description:'No merchant offer',images:[],stock:10,price:10}});const v=await prisma.productVariant.create({data:{productId:p.id,sku:randomUUID(),name:'Synthetic exact option'}});
  const s:RetailSnapshot={version:1,productId:p.id,variantId:v.id,provider:'CJ',providerProductId:'exact-product',providerVariantId:'exact-variant',warehouseId:'exact-warehouse',originCountry:'CN',cjShippingMode:1,destinationCountry:'US',destinationPostal:'10001',quoteId:randomUUID(),quoteRevision:'1',retailUnitCents:1000,currency:'USD',supplierUnitCents:100,shippingQuoteCents:200,freightQuotedQty:2,shippingMethod:'inert-method',availableQty:2,observedAt:now.toISOString(),validUntil:new Date(now.getTime()+maxAgeMs).toISOString(),retailApprovalSource:'LOCAL TEST ONLY',stockSource:'LOCAL TEST ONLY',shippingSource:'LOCAL TEST ONLY'};
  line=bindRetailLine(s,1,now,maxAgeMs);
  await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(s)}::jsonb,${p.id}::uuid,${v.id}::uuid)`;
  await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(s)}::jsonb,${p.id}::uuid,${v.id}::uuid,2,true)`;
  orderId=(await prisma.order.create({data:{userId,shippingAddress:shipping,paymentMethod:'PayPal',itemsPrice:10,shippingPrice:0,taxPrice:0,totalPrice:10,orderitems:{create:{productId:p.id,qty:1,price:10,name:p.name,slug:p.slug,image:''}}}})).id;
 });
 afterAll(async()=>{await prisma.$disconnect()});
 const bind=()=>prisma.$transaction(tx=>persistSupplierOrderPlanTx(tx,{orderId,userId,lines:[line],now,maxAgeMs,commercialTermsSource:'LOCAL TEST ONLY'}));
 it('rolls binding evidence back with the order transaction',async()=>{
  await expect(prisma.$transaction(async tx=>{await persistSupplierOrderPlanTx(tx,{orderId,userId,lines:[line],now,maxAgeMs,commercialTermsSource:'LOCAL TEST ONLY'});throw Error('rollback fixture')})).rejects.toThrow('rollback fixture');
  expect(await prisma.$queryRaw`SELECT "orderId" FROM "OrderSupplierPlan" WHERE "orderId"=${orderId}::uuid`).toEqual([]);
 });
 it('persists an exact source-bound tuple and replays from JSONB without hash/order changes',async()=>{
  expect((await bind()).replayed).toBe(false);expect((await bind()).replayed).toBe(true);
  const p=await prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:false,now,maxAgeMs}));expect(p.lines[0].snapshot.providerVariantId).toBe('exact-variant');expect(p.lines[0].snapshot.warehouseId).toBe('exact-warehouse');expect(p.lines[0].snapshot.shippingMethod).toBe('inert-method');
 });
 it('rejects another user or a caller-changed snapshot without rewriting the binding',async()=>{
  await expect(prisma.$transaction(tx=>persistSupplierOrderPlanTx(tx,{orderId,userId:randomUUID(),lines:[line],now,maxAgeMs,commercialTermsSource:'LOCAL TEST ONLY'}))).rejects.toThrow('Unpaid real order');
  const forged={...line,snapshot:{...line.snapshot,providerVariantId:'wrong-variant'}};
  await expect(prisma.$transaction(tx=>persistSupplierOrderPlanTx(tx,{orderId,userId,lines:[forged],now,maxAgeMs,commercialTermsSource:'LOCAL TEST ONLY'}))).rejects.toThrow('Retail offer');
 });
 it('holds stale quotes and unpaid dispatch while retaining existing orders untouched',async()=>{
  await expect(prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now,maxAgeMs}))).rejects.toThrow('Real order state');
  await expect(prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:false,now:new Date(now.getTime()+maxAgeMs),maxAgeMs}))).rejects.toThrow('Retail offer');
 });
 it('detects post-binding address changes even within the same postal code',async()=>{
  await prisma.order.update({where:{id:orderId},data:{shippingAddress:{...shipping,streetAddress:'changed'}}});
  await expect(prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:false,now,maxAgeMs}))).rejects.toThrow('Order changed');
  await prisma.order.update({where:{id:orderId},data:{shippingAddress:shipping}});
 });
 it('database rejects mutation of approval evidence',async()=>{
  await expect(prisma.$executeRaw`UPDATE "OrderSupplierPlan" SET digest=${'a'.repeat(64)} WHERE "orderId"=${orderId}::uuid`).rejects.toThrow();
 });
 it('retains the immutable tuple across actual paid settlement and refuses a second settlement',async()=>{
  process.env.FULFILLMENT_DISPATCH_ENABLED='false';
  await prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:false,now,maxAgeMs}));
  await updateOrderToPaid({orderId});
  const p=await prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now,maxAgeMs}));
  expect(p.lines[0].snapshot.providerVariantId).toBe('exact-variant');
  await expect(updateOrderToPaid({orderId})).rejects.toMatchObject({settlementCode:'ALREADY_PAID'});
  expect((await prisma.order.findUniqueOrThrow({where:{id:orderId}})).isPaid).toBe(true);
 });

 it('actual non-owner backend role can prepare/settle exact stock but cannot publish offers or rewrite plans',async()=>{
  await prisma.user.update({where:{id:userId},data:{address:shipping,paymentMethod:'PayPal'}});
  const rolledBack=Error('runtime-fixture-rollback');
  await expect(prisma.$transaction(async tx=>{
   const roles=await tx.$queryRaw<{exists:boolean}[]>`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app')`;
   if(!roles[0].exists)await tx.$executeRawUnsafe('CREATE ROLE omnistu_app NOLOGIN NOSUPERUSER NOBYPASSRLS');
   await tx.$executeRawUnsafe(readFileSync('prisma/migrations/20261109112000_supplier_backend_runtime/migration.sql','utf8'));
   // Reproduce only the pre-existing backend privileges needed on core tables.
   await tx.$executeRawUnsafe('GRANT SELECT ON "User","Product","ProductVariant" TO omnistu_app');
   await tx.$executeRawUnsafe('GRANT UPDATE(address) ON "User" TO omnistu_app');
   await tx.$executeRawUnsafe('GRANT SELECT,INSERT,UPDATE ON "Order" TO omnistu_app');
   await tx.$executeRawUnsafe('GRANT SELECT,INSERT ON "OrderItem" TO omnistu_app');
   const carts=await tx.$queryRaw<{id:string}[]>`INSERT INTO "RetailCart"("userId",lines,"destinationCountry","destinationPostal") VALUES(${userId}::uuid,${JSON.stringify([line])}::jsonb,'US','10001') RETURNING id`;
   await tx.$executeRawUnsafe('SET LOCAL ROLE omnistu_app');
   const role=await tx.$queryRaw<{current_user:string;rolbypassrls:boolean;rolsuper:boolean}[]>`SELECT current_user,rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user`;
   expect(role).toEqual([{current_user:'omnistu_app',rolbypassrls:false,rolsuper:false}]);
   const id=await prepareSupplierBoundOrderTx(tx,{userId,cartId:carts[0].id,reviewToken:retailCartReviewToken({lines:[line],destinationCountry:'US',destinationPostal:'10001'}),idempotencyKey:randomUUID(),now,maxAgeMs,approvedShippingCents:0,approvedTaxCents:0,commercialTermsSource:'LOCAL ROLE FIXTURE ONLY'});
   await validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs});
   const {consumeSupplierAllocationTx}=await import('@/lib/supplier-order-plan');await consumeSupplierAllocationTx(tx,{orderId:id,now,maxAgeMs});
   await tx.order.update({where:{id},data:{isPaid:true}});
   expect((await loadSupplierOrderPlanTx(tx,{orderId:id,requirePaid:true,now,maxAgeMs})).lines[0].snapshotId).toBe(line.snapshotId);
   await tx.$executeRaw`INSERT INTO "OrderSupplierAttempt"("orderId",state) VALUES(${id}::uuid,'REQUESTED')`;
   await tx.$executeRaw`UPDATE "OrderSupplierAttempt" SET state='UNKNOWN' WHERE "orderId"=${id}::uuid`;
   const permissions=await tx.$queryRaw`SELECT has_table_privilege(current_user,'"RetailQuote"','INSERT') AS quote_insert,has_column_privilege(current_user,'"RetailOffer"','published','UPDATE') AS publish,has_table_privilege(current_user,'"OrderSupplierPlan"','UPDATE') AS rewrite_plan,has_table_privilege(current_user,'"OrderSupplierAttempt"','DELETE') AS erase_attempt`;
   expect(permissions).toEqual([{quote_insert:false,publish:false,rewrite_plan:false,erase_attempt:false}]);
   throw rolledBack;
  })).rejects.toBe(rolledBack);
 });

 it('atomically binds a customer-selected cart, reserves the exact option and replays one order',async()=>{
  await prisma.user.update({where:{id:userId},data:{address:shipping,paymentMethod:'PayPal'}});
  const rows=await prisma.$queryRaw<{id:string}[]>`INSERT INTO "RetailCart"("userId",lines,"destinationCountry","destinationPostal") VALUES(${userId}::uuid,${JSON.stringify([line])}::jsonb,'US','10001') RETURNING id`;
  const input={userId,cartId:rows[0].id,reviewToken:retailCartReviewToken({lines:[line],destinationCountry:'US',destinationPostal:'10001'}),idempotencyKey:randomUUID(),now,maxAgeMs,approvedShippingCents:0,approvedTaxCents:0,commercialTermsSource:'LOCAL FIXTURE ONLY, NOT LIVE TERMS'};
  const ids=await Promise.all([1,2].map(()=>prisma.$transaction(tx=>prepareSupplierBoundOrderTx(tx,input))));expect(ids[0]).toBe(ids[1]);preparedOrderId=ids[0];
  expect(await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "lineKey"=${line.lineKey}`).toEqual([{availableQty:1}]);
  const plan=await prisma.$transaction(tx=>validateSupplierPaymentPlanTx(tx,{orderId:ids[0],now,maxAgeMs}));expect(plan.lines[0].snapshot.providerVariantId).toBe('exact-variant');
  const before=await prisma.product.findUniqueOrThrow({where:{id:line.snapshot.productId}});
  mockAuth.mockResolvedValue({user:{id:userId,role:'user'}});mockCreatePayPal.mockResolvedValue({id:'PP_SYNTHETIC_PLAN'});
  expect((await createPayPalOrder(ids[0])).success).toBe(true);expect((await createPayPalOrder(ids[0])).data).toBe('PP_SYNTHETIC_PLAN');expect(mockCreatePayPal).toHaveBeenCalledTimes(1);expect(mockCreatePayPal).toHaveBeenCalledWith(10);
  await prisma.order.update({where:{id:ids[0]},data:{shippingAddress:{...shipping,streetAddress:'Changed after mock payment create'}}});
  expect((await approvePayPalOrder(ids[0],{orderID:'PP_SYNTHETIC_PLAN'})).success).toBe(false);expect(mockCapturePayPal).not.toHaveBeenCalled();
  await prisma.order.update({where:{id:ids[0]},data:{shippingAddress:shipping}});
  expect((await approvePayPalOrder(ids[0],{orderID:'PP_WRONG_PLAN'})).success).toBe(false);expect(mockCapturePayPal).not.toHaveBeenCalled();
  mockCapturePayPal.mockResolvedValue({id:'PP_SYNTHETIC_PLAN',status:'COMPLETED',purchase_units:[{payments:{captures:[{id:'CAP_SYNTHETIC_ONLY',status:'COMPLETED',amount:{value:'10.00',currency_code:'USD'}}]}}]});
  expect((await approvePayPalOrder(ids[0],{orderID:'PP_SYNTHETIC_PLAN'})).success).toBe(true);expect(mockCapturePayPal).toHaveBeenCalledTimes(1);
  expect((await approvePayPalOrder(ids[0],{orderID:'PP_SYNTHETIC_PLAN'})).success).toBe(false);expect(mockCapturePayPal).toHaveBeenCalledTimes(1);
  expect((await prisma.order.findUniqueOrThrow({where:{id:ids[0]}})).paymentResult).toMatchObject({paypalEnv:'live'});
  expect(await prisma.$queryRaw`SELECT state FROM "OrderSupplierAllocation" WHERE "orderId"=${ids[0]}::uuid`).toEqual([{state:'CONSUMED'}]);
  expect((await prisma.product.findUniqueOrThrow({where:{id:line.snapshot.productId}})).stock).toBe(before.stock);
  await expect(updateOrderToPaid({orderId:ids[0]})).rejects.toMatchObject({settlementCode:'ALREADY_PAID'});
 });

 it('automatic/operator calls share one durable supplier submission, with exact payload and no paid shipment claim',async()=>{
  process.env.FULFILLMENT_DISPATCH_ENABLED='true';process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD='20';process.env.FULFILLMENT_MAX_ITEM_QTY='2';process.env.CJ_API_KEY='synthetic-key-not-a-secret';
  const calls:{url:string;body:Record<string,unknown>}[]=[];
  const fetcher=jest.spyOn(global,'fetch').mockImplementation(async(url,init)=>{calls.push({url:String(url),body:JSON.parse(String(init?.body))});return new Response(JSON.stringify(String(url).includes('getAccessToken')?{result:true,data:{accessToken:'synthetic-token'}}:{result:true,data:{orderId:'inert-supplier-order'}}),{status:200})});
  try{
   mockAuth.mockResolvedValue({user:{id:userId,role:'admin'}});
   const [automatic,operator]=await Promise.all([dispatchOrderFulfillment({id:preparedOrderId,orderitems:[],shippingAddress:{}}),operatorFulfillment(new Request('http://localhost/api/fulfillment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_id:preparedOrderId})}))]);
   const operatorBody=await operator.json();expect([automatic.dispatches[0].status,operatorBody.receipt.status].sort()).toEqual(['REVIEW_REQUIRED','SUPPLIER_ORDER_CREATED_UNPAID']);expect(automatic.success).toBe(false);expect(automatic.dispatches[0].trackingNumber).toBeNull();
   const orders=calls.filter(c=>c.url.includes('createOrderV2'));expect(orders).toHaveLength(1);
   expect(orders[0].body).toMatchObject({orderNumber:preparedOrderId,fromCountryCode:'CN',storageId:'exact-warehouse',logisticName:'inert-method',shippingProvince:'NY',shippingCountryCode:'US',payType:3,products:[{vid:'exact-variant',quantity:1,storeLineItemId:line.lineKey}]});
   expect(JSON.stringify(orders[0].body)).not.toContain('CJYD223039801AZ');
   expect((await dispatchPersistedSupplierOrder(preparedOrderId)).status).toBe('REVIEW_REQUIRED');expect(calls.filter(c=>c.url.includes('createOrderV2'))).toHaveLength(1);expect(calls.filter(c=>c.url.includes('getAccessToken'))).toHaveLength(1);
  }finally{fetcher.mockRestore();process.env.FULFILLMENT_DISPATCH_ENABLED='false';delete process.env.CJ_API_KEY}
 });

 it('refuses mixed shipping, unsupported suppliers and warehouse-unbound CJ modes',async()=>{
  const p=await prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId:preparedOrderId,requirePaid:true,now,maxAgeMs}));
  for(const patch of [{cjShippingMode:2 as const},{cjShippingMode:undefined},{originCountry:undefined},{provider:'OTHER'}])expect(()=>cjPayloadFromSupplierPlan({...p,lines:p.lines.map(l=>({...l,snapshot:{...l.snapshot,...patch}}))})).toThrow();
  expect(()=>cjPayloadFromSupplierPlan({...p,lines:[...p.lines,{...p.lines[0],snapshot:{...p.lines[0].snapshot,warehouseId:'another-warehouse'}}]})).toThrow();
 });
 it('unknown supplier response is held and never automatically submitted again',async()=>{
  const cart=await prisma.$queryRaw<{id:string}[]>`SELECT id FROM "RetailCart" WHERE "userId"=${userId}::uuid`;
  await prisma.$executeRaw`UPDATE "RetailCart" SET lines=${JSON.stringify([line])}::jsonb WHERE id=${cart[0].id}::uuid`;
  const id=await prisma.$transaction(tx=>prepareSupplierBoundOrderTx(tx,{userId,cartId:cart[0].id,reviewToken:retailCartReviewToken({lines:[line],destinationCountry:'US',destinationPostal:'10001'}),idempotencyKey:randomUUID(),now,maxAgeMs,approvedShippingCents:0,approvedTaxCents:0,commercialTermsSource:'LOCAL TEST ONLY'}));
  await updateOrderToPaid({orderId:id});process.env.FULFILLMENT_DISPATCH_ENABLED='true';process.env.CJ_API_KEY='synthetic-key';
  let submits=0;const fetcher=jest.spyOn(global,'fetch').mockImplementation(async(url)=>{if(String(url).includes('getAccessToken'))return new Response(JSON.stringify({result:true,data:{accessToken:'synthetic'}}));submits++;throw Error('synthetic transport timeout')});
  try{expect((await dispatchPersistedSupplierOrder(id)).status).toBe('REVIEW_REQUIRED');expect((await dispatchPersistedSupplierOrder(id)).status).toBe('REVIEW_REQUIRED');expect(submits).toBe(1);expect(await prisma.$queryRaw`SELECT state FROM "OrderSupplierAttempt" WHERE "orderId"=${id}::uuid`).toEqual([{state:'UNKNOWN'}])}finally{fetcher.mockRestore();process.env.FULFILLMENT_DISPATCH_ENABLED='false';delete process.env.CJ_API_KEY}
 });

});
