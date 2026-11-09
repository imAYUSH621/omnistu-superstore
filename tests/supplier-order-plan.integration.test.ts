import {inspectBoundPaymentRecoveryTx} from '@/lib/bound-payment-recovery';
import {loadReviewedCheckoutTermsTx} from '@/lib/retail/reviewed-checkout';
import {addQualifiedCartAction,createBoundOrderAction} from '@/lib/actions/qualified-retail.actions';
import {readQualifiedCart} from '@/lib/retail/store';
import {cancelMyUnattemptedSupplierOrder} from '@/lib/actions/order.actions';
import {cancelUnattemptedSupplierOrderTx} from '@/lib/supplier-order-cancellation';
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
 const shipping={fullName:'Synthetic buyer',streetAddress:'Fixture only',city:'Fixture City',state:'NY',postalCode:'10001',country:'US',phone:'+12025550100'};
 beforeAll(async()=>{
  userId=(await prisma.user.create({data:{email:`binding-${randomUUID()}@example.invalid`,name:'Synthetic only',password:'not-a-login'}})).id;
  const p=await prisma.product.create({data:{name:'Synthetic line',slug:`binding-itest-${randomUUID()}`,category:'test',description:'No merchant offer',images:[],stock:10,price:10}});const v=await prisma.productVariant.create({data:{productId:p.id,sku:randomUUID(),name:'Synthetic exact option'}});
  const s:RetailSnapshot={version:1,productId:p.id,variantId:v.id,provider:'CJ',providerProductId:'exact-product',providerVariantId:'exact-variant',warehouseId:'exact-warehouse',originCountry:'CN',cjShippingMode:1,destinationCountry:'US',destinationPostal:'10001',quoteId:randomUUID(),quoteRevision:'1',retailUnitCents:1000,currency:'USD',supplierUnitCents:100,shippingQuoteCents:200,freightQuotedQty:2,shippingMethod:'inert-method',availableQty:2,observedAt:now.toISOString(),validUntil:new Date(now.getTime()+maxAgeMs).toISOString(),retailApprovalSource:'LOCAL TEST ONLY',stockSource:'LOCAL TEST ONLY',shippingSource:'LOCAL TEST ONLY'};
  line=bindRetailLine(s,1,now,maxAgeMs);
  await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(s)}::jsonb,${p.id}::uuid,${v.id}::uuid)`;
  await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(s)}::jsonb,${p.id}::uuid,${v.id}::uuid,2,true)`;
  orderId=(await prisma.order.create({data:{userId,shippingAddress:shipping,paymentMethod:'PayPal',itemsPrice:10,shippingPrice:0,taxPrice:0,totalPrice:10,orderitems:{create:{lineKey:line.lineKey,productId:p.id,qty:1,price:10,name:p.name,slug:p.slug,image:''}}}})).id;
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

 it('approved shipping/tax bind immutably; unpaid unattempted cancellation releases once and cannot re-enable payment',async()=>{
  const rollback=Error('fee-cancel-fixture');
  await expect(prisma.$transaction(async tx=>{
   await tx.user.update({where:{id:userId},data:{address:shipping,paymentMethod:'PayPal'}});
   const carts=await tx.$queryRaw<{id:string}[]>`INSERT INTO "RetailCart"("userId",lines,"destinationCountry","destinationPostal") VALUES(${userId}::uuid,${JSON.stringify([line])}::jsonb,'US','10001') RETURNING id`;
   const id=await prepareSupplierBoundOrderTx(tx,{userId,cartId:carts[0].id,reviewToken:retailCartReviewToken({lines:[line],destinationCountry:'US',destinationPostal:'10001'}),idempotencyKey:randomUUID(),now,maxAgeMs,approvedShippingCents:275,approvedTaxCents:125,commercialTermsSource:'LOCAL EXPLICIT FEE FIXTURE, NOT LIVE TERMS'});
   const p=await validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs});expect(p).toMatchObject({amountCents:1400,shippingCents:275,taxCents:125});
   await tx.order.update({where:{id},data:{shippingPrice:1.25,taxPrice:2.75}});
   await expect(validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs})).rejects.toThrow('Order changed');
   await tx.order.update({where:{id},data:{shippingPrice:2.75,taxPrice:1.25}});
   await expect(cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId:randomUUID()})).rejects.toThrow('Order unavailable');
   await tx.order.update({where:{id},data:{paymentResult:{id:'SYNTHETIC_ATTEMPT'}}});
   await expect(cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).rejects.toThrow('Payment outcome');
   await tx.order.update({where:{id},data:{paymentResult:(await import('@prisma/client')).Prisma.DbNull}});
   await tx.$executeRaw`UPDATE "OrderSupplierAllocation" SET state='CONSUMED' WHERE "orderId"=${id}::uuid`;
   await expect(cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).rejects.toThrow('Exact held allocation');
   await tx.$executeRaw`UPDATE "OrderSupplierAllocation" SET state='HELD' WHERE "orderId"=${id}::uuid`;
   await tx.$executeRaw`INSERT INTO "OrderSupplierAttempt"("orderId",state) VALUES(${id}::uuid,'UNKNOWN')`;
   await expect(cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).rejects.toThrow('Supplier attempt');
   await tx.$executeRaw`DELETE FROM "OrderSupplierAttempt" WHERE "orderId"=${id}::uuid`;
   await tx.order.update({where:{id},data:{paymentNote:'SUPPLIER_BOUND_PREPARATION | CAPTURE_UNCONFIRMED'}});
   await expect(cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).rejects.toThrow('Payment outcome');
   await tx.order.update({where:{id},data:{paymentNote:'SUPPLIER_BOUND_PREPARATION',isPaid:true}});
   await expect(cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).rejects.toThrow('Paid order');
   await tx.order.update({where:{id},data:{isPaid:false}});
   expect(await cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).toMatchObject({cancelled:true,replayed:false});expect(await cancelUnattemptedSupplierOrderTx(tx,{orderId:id,userId})).toMatchObject({cancelled:true,replayed:true});
   expect(await tx.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "lineKey"=${line.lineKey}`).toEqual([{availableQty:2}]);
   await expect(validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs})).rejects.toThrow('Exact supplier allocation required');
   throw rollback;
  })).rejects.toBe(rollback);
 });

 it('customer cancellation action authenticates the owner and restores an unattempted allocation once',async()=>{
  const carts=await prisma.$queryRaw<{id:string}[]>`INSERT INTO "RetailCart"("userId",lines,"destinationCountry","destinationPostal") VALUES(${userId}::uuid,${JSON.stringify([line])}::jsonb,'US','10001') RETURNING id`;
  const id=await prisma.$transaction(tx=>prepareSupplierBoundOrderTx(tx,{userId,cartId:carts[0].id,reviewToken:retailCartReviewToken({lines:[line],destinationCountry:'US',destinationPostal:'10001'}),idempotencyKey:randomUUID(),now,maxAgeMs,approvedShippingCents:0,approvedTaxCents:0,commercialTermsSource:'LOCAL CANCEL ACTION FIXTURE'}));
  mockAuth.mockResolvedValue(null);expect((await cancelMyUnattemptedSupplierOrder(id)).success).toBe(false);
  mockAuth.mockResolvedValue({user:{id:randomUUID(),role:'admin'}});expect((await cancelMyUnattemptedSupplierOrder(id)).success).toBe(false);
  mockAuth.mockResolvedValue({user:{id:userId,role:'user'}});expect((await cancelMyUnattemptedSupplierOrder(id)).success).toBe(true);expect((await cancelMyUnattemptedSupplierOrder(id)).success).toBe(true);
  expect(await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "lineKey"=${line.lineKey}`).toEqual([{availableQty:2}]);
  expect((await prisma.order.findUniqueOrThrow({where:{id}})).paymentNote).toContain('SUPPLIER_ORDER_CANCELLED');
  await prisma.$executeRaw`DELETE FROM "RetailCart" WHERE id=${carts[0].id}::uuid`;
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


 it('retains an existing pre-line-key approval without guessing a new variant or rewriting its evidence',async()=>{
  const rollback=Error('legacy-binding-fixture');await expect(prisma.$transaction(async tx=>{
   const source=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now,maxAgeMs});
   const legacyOrder=await tx.order.create({data:{userId,shippingAddress:shipping,paymentMethod:'PayPal',itemsPrice:10,shippingPrice:0,taxPrice:0,totalPrice:10,orderitems:{create:{productId:line.snapshot.productId,name:'Existing legacy option',slug:'legacy-option',image:'',qty:1,price:10}}}});
   const {orderLineIdentity,shippingCents,taxCents,...priorShape}=source;void orderLineIdentity;void shippingCents;void taxCents;
   const priorPlan={...priorShape,orderId:legacyOrder.id};const {supplierPlanDigest}=await import('@/lib/supplier-order-plan');
   await tx.$executeRaw`INSERT INTO "OrderSupplierPlan"("orderId",digest,plan) VALUES(${legacyOrder.id}::uuid,${supplierPlanDigest(priorPlan as never)},${JSON.stringify(priorPlan)}::jsonb)`;
   expect((await loadSupplierOrderPlanTx(tx,{orderId:legacyOrder.id,requirePaid:false,now,maxAgeMs})).lines[0].snapshotId).toBe(source.lines[0].snapshotId);
   await tx.orderItem.create({data:{orderId:legacyOrder.id,productId:line.snapshot.productId,lineKey:'unauthorized-extra-line',name:'Must not become a legacy variant',slug:'legacy-option',image:'',qty:1,price:10}});
   await expect(loadSupplierOrderPlanTx(tx,{orderId:legacyOrder.id,requirePaid:false,now,maxAgeMs})).rejects.toThrow('Order items changed');
   throw rollback;
  })).rejects.toBe(rollback);
 });
 it('two exact variants of one parent survive real payment actions with parent stock zero',async()=>{
  const uid=(await prisma.user.create({data:{email:`multi-${randomUUID()}@example.invalid`,name:'Synthetic multi buyer',address:shipping,paymentMethod:'PayPal'}})).id;
  const product=await prisma.product.create({data:{name:'Synthetic two-option product',slug:`binding-multi-${randomUUID()}`,category:'test',description:'Local fixture only',images:[],price:10,stock:0}});
  const selected:ReturnType<typeof bindRetailLine>[]=[];
  for(const [label,cents]of [['Red',1000],['Blue',1500]]as const){
   const v=await prisma.productVariant.create({data:{productId:product.id,sku:randomUUID(),name:label}});
   const snapshot={...line.snapshot,productId:product.id,variantId:v.id,providerProductId:'synthetic-multi-product',providerVariantId:'synthetic-'+label,quoteId:randomUUID(),retailUnitCents:cents,availableQty:3};const l=bindRetailLine(snapshot,1,now,maxAgeMs);selected.push(l);
   await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${l.lineKey},${l.snapshotId},${JSON.stringify(snapshot)}::jsonb,${product.id}::uuid,${v.id}::uuid)`;
   await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${l.lineKey},${l.snapshotId},${JSON.stringify(snapshot)}::jsonb,${product.id}::uuid,${v.id}::uuid,3,true)`;
  }
  const carts=await prisma.$queryRaw<{id:string}[]>`INSERT INTO "RetailCart"("userId",lines,"destinationCountry","destinationPostal") VALUES(${uid}::uuid,${JSON.stringify(selected)}::jsonb,'US','10001') RETURNING id`;
  const id=await prisma.$transaction(tx=>prepareSupplierBoundOrderTx(tx,{userId:uid,cartId:carts[0].id,reviewToken:retailCartReviewToken({lines:selected,destinationCountry:'US',destinationPostal:'10001'}),idempotencyKey:randomUUID(),now,maxAgeMs,approvedShippingCents:275,approvedTaxCents:125,commercialTermsSource:'LOCAL MULTIVARIANT FEE FIXTURE, NOT LIVE POLICY'}));
  const items=await prisma.orderItem.findMany({where:{orderId:id}});expect(items).toHaveLength(2);expect(new Set(items.map(i=>i.productId)).size).toBe(1);expect(new Set(items.map(i=>i.lineKey)).size).toBe(2);expect(items.map(i=>i.name).sort()).toEqual(['Synthetic two-option product - Blue','Synthetic two-option product - Red']);
  mockAuth.mockResolvedValue({user:{id:uid,role:'user'}});mockCreatePayPal.mockClear();mockCapturePayPal.mockClear();mockCreatePayPal.mockResolvedValue({id:'PP_MULTI_SYNTHETIC'});
  await prisma.orderItem.update({where:{orderId_lineKey:{orderId:id,lineKey:selected[0].lineKey}},data:{lineKey:'wrong-key'}});
  expect((await createPayPalOrder(id)).success).toBe(false);expect(mockCreatePayPal).not.toHaveBeenCalled();
  await prisma.orderItem.update({where:{orderId_lineKey:{orderId:id,lineKey:'wrong-key'}},data:{lineKey:selected[0].lineKey}});
  expect((await createPayPalOrder(id)).success).toBe(true);expect(mockCreatePayPal).toHaveBeenCalledWith(29);
  mockCapturePayPal.mockResolvedValue({id:'PP_MULTI_SYNTHETIC',status:'COMPLETED',purchase_units:[{payments:{captures:[{id:'CAP_MULTI_SYNTHETIC',status:'COMPLETED',amount:{value:'29.00',currency_code:'USD'}}]}}]});
  expect((await approvePayPalOrder(id,{orderID:'PP_MULTI_SYNTHETIC'})).success).toBe(true);expect(mockCapturePayPal).toHaveBeenCalledTimes(1);
  const plan=await prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId:id,requirePaid:true,now,maxAgeMs}));expect(plan.orderLineIdentity).toBe('EXACT_LINE_KEY');expect(plan.lines).toHaveLength(2);expect(cjPayloadFromSupplierPlan(plan).products.map(p=>p.vid).sort()).toEqual(['synthetic-Blue','synthetic-Red']);
  expect(await prisma.$queryRaw`SELECT state FROM "OrderSupplierAllocation" WHERE "orderId"=${id}::uuid`).toEqual([{state:'CONSUMED'},{state:'CONSUMED'}]);expect((await prisma.product.findUniqueOrThrow({where:{id:product.id}})).stock).toBe(0);
 });

 it('ordinary customer selection/review/placement requires independent current exact fees, never client charges',async()=>{
  const env={BOUND_RETAIL_CHECKOUT_ENABLED:process.env.BOUND_RETAIL_CHECKOUT_ENABLED,ORDERS_ENABLED:process.env.ORDERS_ENABLED,TEST_CHECKOUT_MODE:process.env.TEST_CHECKOUT_MODE};
  Object.assign(process.env,{BOUND_RETAIL_CHECKOUT_ENABLED:'true',ORDERS_ENABLED:'true',TEST_CHECKOUT_MODE:'false'});
  try{
   const uid=(await prisma.user.create({data:{email:`ordinary-${randomUUID()}@example.invalid`,name:'Synthetic ordinary customer',address:shipping,paymentMethod:'PayPal'}})).id;mockAuth.mockResolvedValue({user:{id:uid,role:'user'}});
   const product=await prisma.product.create({data:{name:'Synthetic ordinary options',slug:`bound-ordinary-${randomUUID()}`,category:'test',description:'Local fixture',images:[],stock:0,price:10}});
   const lines:ReturnType<typeof bindRetailLine>[]=[];
   for(const label of ['Red','Blue']){const v=await prisma.productVariant.create({data:{productId:product.id,name:label,sku:randomUUID()}});const snapshot={...line.snapshot,productId:product.id,variantId:v.id,providerVariantId:'ordinary-'+label,quoteId:randomUUID(),availableQty:5};const l=bindRetailLine(snapshot,1,now,maxAgeMs);lines.push(l);
    await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${l.lineKey},${l.snapshotId},${JSON.stringify(snapshot)}::jsonb,${product.id}::uuid,${v.id}::uuid)`;
    await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${l.lineKey},${l.snapshotId},${JSON.stringify(snapshot)}::jsonb,${product.id}::uuid,${v.id}::uuid,5,true)`;
    expect((await addQualifiedCartAction({lineKey:l.lineKey,snapshotId:l.snapshotId,qty:1})).success).toBe(true);
   }
   const review=await readQualifiedCart(uid);expect(review?.mode).toBe('bound');expect(review?.terms).toBeNull();expect(review?.lines).toHaveLength(2);const input={cartId:review!.id,reviewToken:review!.reviewToken,termsId:randomUUID() as string,idempotencyKey:randomUUID()};
   expect((await createBoundOrderAction(input)).success).toBe(false);expect((await createBoundOrderAction({...input,shippingCents:0,totalCents:1,approvalSource:'client claim'})).success).toBe(false);
   const storedCart=await prisma.$queryRaw<{lines:typeof lines;destinationCountry:string;destinationPostal:string}[]>`SELECT lines,"destinationCountry","destinationPostal" FROM "RetailCart" WHERE id=${review!.id}::uuid`;
   const terms=await prisma.$queryRaw<{id:string}[]>`INSERT INTO "ReviewedCheckoutTerms"("cartId","userId","reviewToken","cartToken","itemsCents","shippingCents","taxCents","totalCents","approvalSource","policySource","observedAt","validUntil") VALUES(${review!.id}::uuid,${uid}::uuid,${review!.reviewToken},${retailCartReviewToken(storedCart[0])},2000,300,100,2400,'LOCAL EXPLICIT TERMS FIXTURE','LOCAL POLICY FIXTURE',${now},${new Date(now.getTime()+maxAgeMs)}) RETURNING id`;
   input.termsId=terms[0].id;await expect(prisma.$executeRaw`UPDATE "ReviewedCheckoutTerms" SET "shippingCents"=0 WHERE id=${input.termsId}::uuid`).rejects.toThrow();
   expect(await loadReviewedCheckoutTermsTx(prisma,{userId:uid,cartId:review!.id,reviewToken:review!.reviewToken,cartToken:retailCartReviewToken(storedCart[0]),itemsCents:2000,termsId:input.termsId,now:new Date(now.getTime()+maxAgeMs)})).toBeNull();expect((await readQualifiedCart(uid))?.terms).toMatchObject({id:input.termsId,shipping:'3.00',tax:'1.00',total:'24.00'});
   await prisma.user.update({where:{id:uid},data:{address:{...shipping,phone:'+12025550101'}}});expect((await readQualifiedCart(uid))?.terms).toBeNull();expect((await createBoundOrderAction(input)).success).toBe(false);
   await prisma.user.update({where:{id:uid},data:{address:shipping}});
   mockAuth.mockResolvedValue({user:{id:userId,role:'admin'}});expect((await createBoundOrderAction(input)).success).toBe(false);
   mockAuth.mockResolvedValue({user:{id:uid,role:'user'}});const result=await createBoundOrderAction(input);expect(result.success).toBe(true);expect(await createBoundOrderAction(input)).toEqual(result);expect((await createBoundOrderAction({...input,reviewToken:'b'.repeat(64)})).success).toBe(false);
   if(!result.success)throw Error('fixture placement failed');const id=result.redirectTo.split('/').pop()!;const order=await prisma.order.findUniqueOrThrow({where:{id},include:{orderitems:true}});expect(order.orderitems).toHaveLength(2);expect(order).toMatchObject({itemsPrice:'20',shippingPrice:'3',taxPrice:'1',totalPrice:'24',isPaid:false,paymentMethod:'PayPal'});
   const plan=await prisma.$transaction(tx=>validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs}));expect(plan.commercialTermsSource).toContain(input.termsId);expect(plan.amountCents).toBe(2400);
   expect((await readQualifiedCart(uid))?.lines).toHaveLength(0);mockCreatePayPal.mockClear();mockCreatePayPal.mockResolvedValue({id:'PP_ORDINARY_INERT'});expect((await createPayPalOrder(id)).success).toBe(true);expect(mockCreatePayPal).toHaveBeenCalledWith(24);
   const before=await prisma.order.findUniqueOrThrow({where:{id}}),stockBefore=await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "productId"=${product.id}::uuid ORDER BY "lineKey"`;
   expect(await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:uid,now,maxAgeMs}))).toBe('READY');
   expect(await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:uid,now:new Date(now.getTime()+maxAgeMs),maxAgeMs}))).toBe('PAYMENT_REVIEW');
   await prisma.order.update({where:{id},data:{paymentNote:before.paymentNote+' | CAPTURE_UNCONFIRMED'}});
   expect(await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:uid,now,maxAgeMs}))).toBe('PAYMENT_REVIEW');
   const held=await prisma.order.findUniqueOrThrow({where:{id}});expect(held.isPaid).toBe(false);expect(held.paymentResult).toEqual(before.paymentResult);expect(held.paymentNote).toContain('CAPTURE_UNCONFIRMED');
   expect(await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "productId"=${product.id}::uuid ORDER BY "lineKey"`).toEqual(stockBefore);
   await expect(prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:userId,now,maxAgeMs}))).rejects.toThrow('Order unavailable');

  }finally{for(const[k,v]of Object.entries(env)){if(v===undefined)delete process.env[k];else process.env[k]=v}}
 });
 it('CJ-managed mode2 ordinary action binds approved origin without invented warehouse and holds missing confirmation',async()=>{
  const env={BOUND_RETAIL_CHECKOUT_ENABLED:process.env.BOUND_RETAIL_CHECKOUT_ENABLED,ORDERS_ENABLED:process.env.ORDERS_ENABLED,TEST_CHECKOUT_MODE:process.env.TEST_CHECKOUT_MODE,CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED:process.env.CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED};
  Object.assign(process.env,{BOUND_RETAIL_CHECKOUT_ENABLED:'true',ORDERS_ENABLED:'true',TEST_CHECKOUT_MODE:'false',CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED:'true'});
  try{
   const uid=(await prisma.user.create({data:{email:`ordinary-${randomUUID()}@example.invalid`,name:'Synthetic ordinary customer',address:shipping,paymentMethod:'PayPal'}})).id;mockAuth.mockResolvedValue({user:{id:uid,role:'user'}});
   const product=await prisma.product.create({data:{name:'Synthetic ordinary options',slug:`bound-ordinary-${randomUUID()}`,category:'test',description:'Local fixture',images:[],stock:0,price:10}});
   const lines:ReturnType<typeof bindRetailLine>[]=[];
   for(const label of ['Red','Blue']){const v=await prisma.productVariant.create({data:{productId:product.id,name:label,sku:randomUUID()}});const snapshot={...line.snapshot,version:2 as const,warehouseId:undefined,cjShippingMode:2 as const,managedOrigin:{kind:'CJ_MANAGED_ORIGIN' as const,assignment:'CJ_SELECTS_WAREHOUSE_WITHIN_APPROVED_ORIGIN' as const,availabilityConfirmationRef:'LOCAL MANUAL SUPPLIER AVAILABILITY FIXTURE NOT REAL ACCEPTANCE',confirmedAvailableQty:5,handlingMaxDays:4,stockEvidenceRef:'LOCAL EXACT OPTION STOCK FIXTURE',freightEvidenceRef:'LOCAL EXACT MODE2 FREIGHT FIXTURE',fulfillmentTermsRef:'LOCAL SOURCING/RETURNS TERMS FIXTURE',observedAt:now.toISOString(),validUntil:new Date(now.getTime()+maxAgeMs).toISOString()},productId:product.id,variantId:v.id,providerVariantId:'ordinary-'+label,quoteId:randomUUID(),availableQty:5};const l=bindRetailLine(snapshot,1,now,maxAgeMs);lines.push(l);
    await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${l.lineKey},${l.snapshotId},${JSON.stringify(snapshot)}::jsonb,${product.id}::uuid,${v.id}::uuid)`;
    await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${l.lineKey},${l.snapshotId},${JSON.stringify(snapshot)}::jsonb,${product.id}::uuid,${v.id}::uuid,5,true)`;
    expect((await addQualifiedCartAction({lineKey:l.lineKey,snapshotId:l.snapshotId,qty:1})).success).toBe(true);
   }
   const review=await readQualifiedCart(uid);expect(review?.mode).toBe('bound');expect(review?.terms).toBeNull();expect(review?.lines).toHaveLength(2);const input={cartId:review!.id,reviewToken:review!.reviewToken,termsId:randomUUID() as string,idempotencyKey:randomUUID()};
   expect((await createBoundOrderAction(input)).success).toBe(false);expect((await createBoundOrderAction({...input,shippingCents:0,totalCents:1,approvalSource:'client claim'})).success).toBe(false);
   const storedCart=await prisma.$queryRaw<{lines:typeof lines;destinationCountry:string;destinationPostal:string}[]>`SELECT lines,"destinationCountry","destinationPostal" FROM "RetailCart" WHERE id=${review!.id}::uuid`;
   const terms=await prisma.$queryRaw<{id:string}[]>`INSERT INTO "ReviewedCheckoutTerms"("cartId","userId","reviewToken","cartToken","itemsCents","shippingCents","taxCents","totalCents","approvalSource","policySource","observedAt","validUntil") VALUES(${review!.id}::uuid,${uid}::uuid,${review!.reviewToken},${retailCartReviewToken(storedCart[0])},2000,300,100,2400,'LOCAL EXPLICIT TERMS FIXTURE','LOCAL POLICY FIXTURE',${now},${new Date(now.getTime()+maxAgeMs)}) RETURNING id`;
   input.termsId=terms[0].id;await expect(prisma.$executeRaw`UPDATE "ReviewedCheckoutTerms" SET "shippingCents"=0 WHERE id=${input.termsId}::uuid`).rejects.toThrow();
   expect(await loadReviewedCheckoutTermsTx(prisma,{userId:uid,cartId:review!.id,reviewToken:review!.reviewToken,cartToken:retailCartReviewToken(storedCart[0]),itemsCents:2000,termsId:input.termsId,now:new Date(now.getTime()+maxAgeMs)})).toBeNull();expect((await readQualifiedCart(uid))?.terms).toMatchObject({id:input.termsId,shipping:'3.00',tax:'1.00',total:'24.00'});
   await prisma.user.update({where:{id:uid},data:{address:{...shipping,phone:'+12025550101'}}});expect((await readQualifiedCart(uid))?.terms).toBeNull();expect((await createBoundOrderAction(input)).success).toBe(false);
   await prisma.user.update({where:{id:uid},data:{address:shipping}});
   mockAuth.mockResolvedValue({user:{id:userId,role:'admin'}});expect((await createBoundOrderAction(input)).success).toBe(false);
   mockAuth.mockResolvedValue({user:{id:uid,role:'user'}});const result=await createBoundOrderAction(input);expect(result.success).toBe(true);expect(await createBoundOrderAction(input)).toEqual(result);expect((await createBoundOrderAction({...input,reviewToken:'b'.repeat(64)})).success).toBe(false);
   if(!result.success)throw Error('fixture placement failed');const id=result.redirectTo.split('/').pop()!;const order=await prisma.order.findUniqueOrThrow({where:{id},include:{orderitems:true}});expect(order.orderitems).toHaveLength(2);expect(order).toMatchObject({itemsPrice:'20',shippingPrice:'3',taxPrice:'1',totalPrice:'24',isPaid:false,paymentMethod:'PayPal'});
   const plan=await prisma.$transaction(tx=>validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs}));expect(plan.commercialTermsSource).toContain(input.termsId);expect(plan.amountCents).toBe(2400);const payload=cjPayloadFromSupplierPlan(plan);expect(payload.shopLogisticsType).toBe(2);expect(payload).not.toHaveProperty('storageId');expect(payload.products).toHaveLength(2);expect(payload.payType).toBe(3);delete process.env.CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED;await expect(prisma.$transaction(tx=>validateSupplierPaymentPlanTx(tx,{orderId:id,now,maxAgeMs}))).rejects.toThrow('OFF');process.env.CJ_MANAGED_ORIGIN_CHECKOUT_ENABLED='true';
   expect((await readQualifiedCart(uid))?.lines).toHaveLength(0);mockCreatePayPal.mockClear();mockCreatePayPal.mockResolvedValue({id:'PP_ORDINARY_INERT'});expect((await createPayPalOrder(id)).success).toBe(true);expect(mockCreatePayPal).toHaveBeenCalledWith(24);
   const before=await prisma.order.findUniqueOrThrow({where:{id}}),stockBefore=await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "productId"=${product.id}::uuid ORDER BY "lineKey"`;
   expect(await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:uid,now,maxAgeMs}))).toBe('READY');
   expect(await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:uid,now:new Date(now.getTime()+maxAgeMs),maxAgeMs}))).toBe('PAYMENT_REVIEW');
   await prisma.order.update({where:{id},data:{paymentNote:before.paymentNote+' | CAPTURE_UNCONFIRMED'}});
   expect(await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:uid,now,maxAgeMs}))).toBe('PAYMENT_REVIEW');
   const held=await prisma.order.findUniqueOrThrow({where:{id}});expect(held.isPaid).toBe(false);expect(held.paymentResult).toEqual(before.paymentResult);expect(held.paymentNote).toContain('CAPTURE_UNCONFIRMED');
   expect(await prisma.$queryRaw`SELECT "availableQty" FROM "RetailOffer" WHERE "productId"=${product.id}::uuid ORDER BY "lineKey"`).toEqual(stockBefore);
   await expect(prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:id,userId:userId,now,maxAgeMs}))).rejects.toThrow('Order unavailable');

  }finally{for(const[k,v]of Object.entries(env)){if(v===undefined)delete process.env[k];else process.env[k]=v}}
 });

 it('hosted inherited defaults cannot grant review writing, publication or attempt erasure after scoped hardening',async()=>{
  const rollback=Error('acl-fixture-rollback');await expect(prisma.$transaction(async tx=>{
   await tx.$executeRawUnsafe(`DO $$BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app')THEN CREATE ROLE omnistu_app NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;END$$`);
   const tables=['RetailQuote','RetailOffer','RetailCart','OrderSupplierPlan','OrderSupplierAllocation','OrderSupplierAttempt','ReviewedCheckoutTerms'];
   for(const table of tables)await tx.$executeRawUnsafe('GRANT SELECT,INSERT,UPDATE,DELETE ON "'+table+'" TO omnistu_app');
   await tx.$executeRawUnsafe('GRANT UPDATE (published) ON "RetailOffer" TO omnistu_app');
   const before=await tx.$queryRaw`SELECT has_table_privilege('omnistu_app','"ReviewedCheckoutTerms"','INSERT') terms_write,has_column_privilege('omnistu_app','"RetailOffer"','published','UPDATE') publish`;
   expect(before).toEqual([{terms_write:true,publish:true}]);
   const coreBefore=await tx.$queryRaw`SELECT relacl::text FROM pg_class WHERE oid='"Order"'::regclass`;
   const migration=readFileSync('prisma/migrations/20261109130000_scoped_runtime_privileges/migration.sql','utf8');await tx.$executeRawUnsafe(migration);await tx.$executeRawUnsafe(migration);
   const after=await tx.$queryRaw`SELECT has_table_privilege('omnistu_app','"ReviewedCheckoutTerms"','SELECT') terms_read,has_table_privilege('omnistu_app','"ReviewedCheckoutTerms"','INSERT,UPDATE,DELETE') terms_write,has_column_privilege('omnistu_app','"RetailOffer"','published','UPDATE') publish,has_column_privilege('omnistu_app','"RetailOffer"','availableQty','UPDATE') stock,has_table_privilege('omnistu_app','"OrderSupplierAttempt"','DELETE') erase,has_table_privilege('omnistu_app','"OrderSupplierPlan"','UPDATE') rewrite`;
   expect(after).toEqual([{terms_read:true,terms_write:false,publish:false,stock:true,erase:false,rewrite:false}]);expect(await tx.$queryRaw`SELECT relacl::text FROM pg_class WHERE oid='"Order"'::regclass`).toEqual(coreBefore);
   throw rollback;
  })).rejects.toThrow(rollback);
 });

});
