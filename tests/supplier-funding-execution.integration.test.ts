import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {prisma} from '@/db/prisma';
import {localDatabaseTestEnabled} from './helpers/local-database';
import {bindRetailLine,type RetailSnapshot} from '@/lib/retail/snapshot';
import {supplierPlanDigest,type SupplierOrderPlan} from '@/lib/supplier-order-plan';
import {supplierFundingQuote} from '@/lib/cj-funding-evidence';
import {executeSupplierFunding} from '@/lib/supplier-funding-execution';
const mockAuth=jest.fn();jest.mock('@/auth',()=>({auth:()=>mockAuth()}));
import {executeSupplierFundingAction,reviewSupplierFundingExecutionAction} from '@/lib/actions/supplier-funding.actions';
const suite=localDatabaseTestEnabled()?describe:describe.skip;
const j=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status});
suite('supplier funding execution on disposable real PostgreSQL; mocked provider, no live spend',()=>{
 const shipping={fullName:'Synthetic only',streetAddress:'Fixture only',city:'Fixture city',state:'NY',postalCode:'10001',country:'US',phone:'+12025550100'};
 let userId:string,productId:string;
 const previous={CJ_FUNDING_EXECUTION_ENABLED:process.env.CJ_FUNDING_EXECUTION_ENABLED,CJ_API_KEY:process.env.CJ_API_KEY};
 beforeAll(async()=>{
  await prisma.$executeRawUnsafe(`DO $$BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnistu_app')THEN CREATE ROLE omnistu_app NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;END$$`);
  const migration=readFileSync('prisma/migrations/20261111100000_supplier_funding_execution/migration.sql','utf8');
  await prisma.$executeRawUnsafe(migration.slice(migration.indexOf('DO $$'),migration.indexOf('CREATE FUNCTION')));
  userId=(await prisma.user.create({data:{email:`funding-exec-${randomUUID()}@example.invalid`,name:'Synthetic only',password:'not-a-login'}})).id;
  productId=(await prisma.product.create({data:{name:'Synthetic only',slug:randomUUID(),category:'test',description:'No merchant offer',images:[],stock:1,price:10}})).id;
 });
 afterAll(async()=>{for(const[k,v]of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v}await prisma.$disconnect()});
 afterEach(()=>jest.restoreAllMocks());
 const parentRaw=(supplierOrderId:string,payId:string,freight='2.00')=>({orderMoney:'3.00',payId,payExpireTime:'2026-11-12 00:00:00',result:0,submitSuccess:true,successOrders:[supplierOrderId],unMatchOrderCodes:[],unMatchProductCodes:[],interceptOrders:[],paymentInformation:{actualPayment:'3.00',payableAmount:'3.00',balanceDeduction:'3.00',billAmount:'3.00',commodityDiscount:'0.00',commodityTotalAmount:'1.00',couponAmount:'0.00',freight,iossAmount:'0.00',iossTaxHandlingFee:'0.00',iossTaxes:'0.00',orderOriginalAmount:'3.00',orderProductAmount:'1.00',postageDiscount:'0.00',serviceFee:'0.00',canDeduct:true}});
 async function fixture(){
  const variantId=(await prisma.productVariant.create({data:{productId,sku:randomUUID(),name:'Synthetic option'}})).id;
  const now=new Date();
  const snapshot:RetailSnapshot={version:1,productId,variantId,provider:'CJ',providerProductId:'LOCAL_PRODUCT',providerVariantId:'LOCAL_VARIANT',warehouseId:'LOCAL_WAREHOUSE',originCountry:'CN',cjShippingMode:1,destinationCountry:'US',destinationPostal:'10001',quoteId:randomUUID(),quoteRevision:'1',retailUnitCents:1000,currency:'USD',supplierUnitCents:100,shippingQuoteCents:200,freightQuotedQty:1,shippingMethod:'LOCAL_METHOD',availableQty:1,observedAt:now.toISOString(),validUntil:new Date(now.getTime()+600000).toISOString(),retailApprovalSource:'LOCAL ONLY',stockSource:'LOCAL ONLY',shippingSource:'LOCAL ONLY'};
  const line=bindRetailLine(JSON.parse(JSON.stringify(snapshot)),1,now,600000);
  const o=await prisma.order.create({data:{userId,isPaid:true,shippingAddress:shipping,paymentMethod:'PayPal',itemsPrice:10,shippingPrice:0,taxPrice:0,totalPrice:10,paymentNote:'SUPPLIER_BOUND_PREPARATION',orderitems:{create:{lineKey:line.lineKey,productId,qty:1,price:10,name:'Synthetic only',slug:'synthetic',image:''}}}});
  await prisma.$executeRaw`INSERT INTO "RetailQuote"("lineKey","snapshotId",snapshot,"productId","variantId") VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(snapshot)}::jsonb,${productId}::uuid,${variantId}::uuid)`;
  await prisma.$executeRaw`INSERT INTO "RetailOffer"("lineKey","snapshotId",snapshot,"productId","variantId","availableQty",published) VALUES(${line.lineKey},${line.snapshotId},${JSON.stringify(snapshot)}::jsonb,${productId}::uuid,${variantId}::uuid,1,true)`;
  const plan:SupplierOrderPlan={version:1,orderLineIdentity:'EXACT_LINE_KEY',orderId:o.id,userId,address:shipping,amountCents:1000,shippingCents:0,taxCents:0,commercialTermsSource:'LOCAL ONLY',lines:[line]};
  const digest=supplierPlanDigest(plan),supplierId='SD_LOCAL_'+o.id.replace(/-/g,'').slice(0,20);
  await prisma.$executeRaw`INSERT INTO "OrderSupplierPlan"("orderId",digest,plan) VALUES(${o.id}::uuid,${digest},${JSON.stringify(plan)}::jsonb)`;
  await prisma.$executeRaw`INSERT INTO "OrderSupplierAllocation"("orderId","lineKey",qty,state) VALUES(${o.id}::uuid,${line.lineKey},1,'CONSUMED')`;
  await prisma.$executeRaw`INSERT INTO "OrderSupplierAttempt"("orderId",state,"supplierOrderId") VALUES(${o.id}::uuid,'ACCEPTED',${supplierId})`;
  await prisma.$executeRaw`INSERT INTO "SupplierFundingPreparation"("orderId","planDigest","supplierOrderId",state,"detailDigest") VALUES(${o.id}::uuid,${digest},${supplierId},'CONFIRM_UNKNOWN','LOCAL')`;
  await prisma.$executeRaw`UPDATE "SupplierFundingPreparation" SET state='PARENT_UNKNOWN',"shipmentOrderId"='SHIP_LOCAL',"confirmationDigest"='LOCAL' WHERE "orderId"=${o.id}::uuid`;
  const quote=supplierFundingQuote(parentRaw(supplierId,'PAY_LOCAL_1'),supplierId,'SHIP_LOCAL');
  await prisma.$executeRaw`UPDATE "SupplierFundingPreparation" SET state='REVIEW_ONLY',quote=${JSON.stringify(quote)}::jsonb,"parentDigest"='LOCAL' WHERE "orderId"=${o.id}::uuid`;
  const base={orderId:supplierId,orderNum:'PROVIDER_NAME',shippingZip:'10001',shippingCountryCode:'US',shippingProvince:shipping.state,shippingCity:shipping.city,shippingPhone:shipping.phone,shippingAddress:shipping.streetAddress,shippingCustomerName:shipping.fullName,fromCountryCode:'CN',logisticName:snapshot.shippingMethod,storageId:snapshot.warehouseId,isSandbox:0 as const,currency:'USD' as const,orderAmount:'3.00',outWarehouseTime:null,trackNumber:null,trackingProvider:null,productList:[{vid:snapshot.providerVariantId,quantity:1,storeLineItemId:line.lineKey}]};
  return {id:o.id,supplierId,
   unpaid:{...base,orderStatus:'UNPAID' as const,paymentDate:null},
   created:{...base,orderStatus:'CREATED' as const,paymentDate:null},
   paid:{...base,orderStatus:'UNSHIPPED' as const,paymentDate:'2026-11-01 12:03:00'},
   cancelled:{...base,orderStatus:'CANCELLED' as const,paymentDate:null}};
 }
 type Pay=(ctx:{setDetail:(d:unknown)=>void})=>Promise<Response>;
 function fetcher(f:Awaited<ReturnType<typeof fixture>>,scenario:{detail:unknown;pays:Pay[];payIds?:string[];broken?:{current:boolean}}){
  const payBodies:unknown[]=[];const state={detail:scenario.detail,broken:scenario.broken??{current:false}};
  const spy=jest.spyOn(global,'fetch').mockImplementation(async(url,init)=>{
   const path=String(url);
   if(path.endsWith('/authentication/getAccessToken'))return j({result:true,data:{accessToken:'LOCAL_NOT_A_TOKEN'}});
   if(path.includes('/getOrderDetail?')){expect(path.endsWith(encodeURIComponent(f.supplierId))).toBe(true);if(state.broken.current)return j({result:false,code:1610001,message:'unavailable'});return j({result:true,data:state.detail});}
   if(path.endsWith('/shopping/order/saveGenerateParentOrder')){expect(JSON.parse(String(init?.body))).toEqual({shipmentOrderId:'SHIP_LOCAL'});const payId=scenario.payIds?.shift()??'PAY_LOCAL_1';return j({result:true,data:parentRaw(f.supplierId,payId)});}
   if(path.endsWith('/shopping/pay/payBalanceV2')){payBodies.push(JSON.parse(String(init?.body)));const b=scenario.pays.shift();if(!b)throw Error('unexpected extra payment attempt');return b({setDetail:d=>{state.detail=d;}});}
   throw Error('unexpected provider call '+path);
  });
  return {spy,payBodies,broken:state.broken,setDetail:(d:unknown)=>{state.detail=d;}};
 }
 const paySuccess=(f:Awaited<ReturnType<typeof fixture>>):Pay=>async({setDetail})=>{setDetail(f.paid);return j({result:true,code:200,data:null});};
 const payError=(message:string):Pay=>async()=>j({result:false,code:1610001,message});
 const payReject:Pay=async()=>{throw new Error('socket reset');};
 function enable(){process.env.CJ_FUNDING_EXECUTION_ENABLED='true';process.env.CJ_API_KEY='LOCAL_NOT_A_KEY';mockAuth.mockResolvedValue({user:{id:userId,role:'admin'}});}
 const row=(id:string)=>prisma.$queryRaw<{state:string;attempts:number;regenerated:boolean;payId:string;shipmentOrderId:string;retryPayId:string|null;holdReason:string|null;confirmationDigest:string|null}[]>`SELECT state,attempts,regenerated,"payId","shipmentOrderId","retryPayId","holdReason","confirmationDigest" FROM "SupplierFundingExecution" WHERE "orderId"=${id}::uuid`;
 it('OFF and unauthorized callers make no provider call',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[paySuccess(f)]});
  delete process.env.CJ_FUNDING_EXECUTION_ENABLED;
  await expect(executeSupplierFunding(f.id,'3.00',userId)).rejects.toThrow('OFF');
  enable();mockAuth.mockResolvedValue({user:{id:userId,role:'user'}});
  expect((await executeSupplierFundingAction(f.id,'3.00')).success).toBe(false);
  expect(m.spy).not.toHaveBeenCalled();expect(await row(f.id)).toEqual([]);
 });
 it('wrong approved amount fails before any provider call',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[]});enable();
  expect((await executeSupplierFundingAction(f.id,'3.01')).success).toBe(false);
  expect(m.spy).not.toHaveBeenCalled();expect(await row(f.id)).toEqual([]);
 });
 it('confirmed success records the exact pair, PAID evidence and funded lifecycle',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[paySuccess(f)]});enable();
  const r=await executeSupplierFundingAction(f.id,'3.00');
  expect(r).toMatchObject({success:true,state:'PAID'});
  expect(m.payBodies).toEqual([{shipmentOrderId:'SHIP_LOCAL',payId:'PAY_LOCAL_1'}]);
  expect(await row(f.id)).toMatchObject([{state:'PAID',attempts:1,regenerated:false,payId:'PAY_LOCAL_1',shipmentOrderId:'SHIP_LOCAL',retryPayId:null,holdReason:null}]);
  expect((await row(f.id))[0].confirmationDigest).toBeTruthy();
  const lc=await prisma.$queryRaw<{state:string}[]>`SELECT evidence->>'state' AS state FROM "SupplierLifecycleObservation" WHERE "orderId"=${f.id}::uuid`;
  expect(lc).toEqual([{state:'FUNDED_AWAITING_SHIPMENT'}]);
  expect((await prisma.order.findUniqueOrThrow({where:{id:f.id}})).dispatchStatus).toBe('FUNDED_AWAITING_SHIPMENT');
 });
 it('a success response with a still-unpaid order is held, never treated as paid',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[async()=>j({result:true,code:200,data:null})]});enable();
  const r=await executeSupplierFundingAction(f.id,'3.00');
  expect(r).toMatchObject({success:true,state:'HOLD_REVIEW'});
  expect(await row(f.id)).toMatchObject([{state:'HOLD_REVIEW',attempts:1,holdReason:'PAY_SUCCESS_BUT_SUPPLIER_UNPAID'}]);
  expect(m.payBodies).toHaveLength(1);
 });
 it('an explicit expiry error regenerates a new payId for the same parent once, then pays',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[payError('The payment has expired, please regenerate the payment'),paySuccess(f)],payIds:['PAY_LOCAL_1','PAY_LOCAL_2']});enable();
  const r=await executeSupplierFundingAction(f.id,'3.00');
  expect(r).toMatchObject({success:true,state:'PAID'});
  expect(m.payBodies).toEqual([{shipmentOrderId:'SHIP_LOCAL',payId:'PAY_LOCAL_1'},{shipmentOrderId:'SHIP_LOCAL',payId:'PAY_LOCAL_2'}]);
  expect(await row(f.id)).toMatchObject([{state:'PAID',attempts:2,regenerated:true,payId:'PAY_LOCAL_1',retryPayId:'PAY_LOCAL_2',shipmentOrderId:'SHIP_LOCAL'}]);
 });
 it('a lost response retries the identical pair once after a confirmed-unpaid read',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[payReject,paySuccess(f)]});enable();
  const r=await executeSupplierFundingAction(f.id,'3.00');
  expect(r).toMatchObject({success:true,state:'PAID'});
  expect(m.payBodies).toEqual([{shipmentOrderId:'SHIP_LOCAL',payId:'PAY_LOCAL_1'},{shipmentOrderId:'SHIP_LOCAL',payId:'PAY_LOCAL_1'}]);
  expect(await row(f.id)).toMatchObject([{state:'PAID',attempts:2,regenerated:false,payId:'PAY_LOCAL_1',retryPayId:null}]);
 });
 it('unreadable state after a lost response stays PAY_UNKNOWN, then read-only review confirms paid',async()=>{
  const f=await fixture();
  const broken={current:false};
  const m=fetcher(f,{detail:f.unpaid,broken,pays:[async({setDetail})=>{broken.current=true;setDetail(f.paid);throw new Error('socket reset');}]});
  enable();
  const r1=await executeSupplierFundingAction(f.id,'3.00');
  expect(r1).toMatchObject({success:true,state:'PAY_UNKNOWN'});
  expect(m.payBodies).toHaveLength(1);
  expect(await row(f.id)).toMatchObject([{state:'PAY_UNKNOWN',attempts:1}]);
  broken.current=false;
  const r2=await reviewSupplierFundingExecutionAction(f.id);
  expect(r2).toMatchObject({success:true,state:'PAID'});
  expect(await row(f.id)).toMatchObject([{state:'PAID',attempts:1}]);
  expect(m.payBodies).toHaveLength(1); // review never pays
 });
 it('a failed grounded retry with confirmed-unpaid holds instead of looping',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[payReject,payReject]});enable();
  const r=await executeSupplierFundingAction(f.id,'3.00');
  expect(r).toMatchObject({success:true,state:'HOLD_REVIEW'});
  expect(await row(f.id)).toMatchObject([{state:'HOLD_REVIEW',attempts:2,holdReason:'SUPPLIER_UNPAID_AFTER_CONFIRMED_RETRY'}]);
  expect(m.payBodies).toHaveLength(2);
 });
 it('concurrent executions pay at most once',async()=>{
  const f=await fixture(),m=fetcher(f,{detail:f.unpaid,pays:[paySuccess(f)],payIds:['PAY_LOCAL_1','PAY_LOCAL_1']});enable();
  const [a,b]=await Promise.all([executeSupplierFundingAction(f.id,'3.00'),executeSupplierFundingAction(f.id,'3.00')]);
  expect([a.success,b.success].sort()).toEqual([false,true]);
  expect(m.payBodies).toHaveLength(1);
  expect(await row(f.id)).toMatchObject([{state:'PAID'}]);
 });
 it('cancelled or already-funded supplier orders are never paid',async()=>{
  for(const which of['cancelled','paid'] as const){
   const f=await fixture(),m=fetcher(f,{detail:f[which],pays:[]});enable();
   const r=await executeSupplierFundingAction(f.id,'3.00');
   expect(r.success).toBe(false);
   expect(m.payBodies).toHaveLength(0);expect(await row(f.id)).toEqual([]);
   m.spy.mockRestore();
  }
 });
 it('a regenerated quote with any changed amount aborts before claim and payment',async()=>{
  const f=await fixture();
  const drift=parentRaw(f.supplierId,'PAY_LOCAL_1','2.50');
  const spy=jest.spyOn(global,'fetch').mockImplementation(async(url)=>{
   const path=String(url);
   if(path.endsWith('/authentication/getAccessToken'))return j({result:true,data:{accessToken:'LOCAL_NOT_A_TOKEN'}});
   if(path.includes('/getOrderDetail?'))return j({result:true,data:f.unpaid});
   if(path.endsWith('/shopping/order/saveGenerateParentOrder'))return j({result:true,data:drift});
   throw Error('unexpected provider call '+path);
  });
  enable();
  const r=await executeSupplierFundingAction(f.id,'3.00');
  expect(r.success).toBe(false);expect(r.success? '':r.message).toMatch(/amounts changed/);
  expect(spy.mock.calls.some(c=>String(c[0]).includes('payBalanceV2'))).toBe(false);
  expect(await row(f.id)).toEqual([]);
 });
 it('database guard enforces one-way states, immutable pair and no erasure; runtime role cannot rewrite',async()=>{
  const f=await fixture();
  await prisma.$executeRaw`INSERT INTO "SupplierFundingExecution"("orderId","planDigest","supplierOrderId","shipmentOrderId","payId","approvedAmountUsd","approvedBy","quoteDigest",state,attempts) VALUES (${f.id}::uuid,'LOCAL','SD_LOCAL','SHIP_LOCAL','PAY_LOCAL_1','3.00','LOCAL_ADMIN','LOCAL','PAY_REQUESTED',1)`;
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET "payId"='OTHER' WHERE "orderId"=${f.id}::uuid`).rejects.toThrow(/immutable/);
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET state='PAID' WHERE "orderId"=${f.id}::uuid`).rejects.toThrow(/confirmation evidence/);
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET state='PAY_UNKNOWN' WHERE "orderId"=${f.id}::uuid`).resolves.toBe(1);
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET state='PAY_REQUESTED' WHERE "orderId"=${f.id}::uuid`).rejects.toThrow(/transition/);
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET attempts=3 WHERE "orderId"=${f.id}::uuid`).rejects.toThrow();
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET state='RETRY_REQUESTED',attempts=2,"retryPayId"='PAY_LOCAL_1' WHERE "orderId"=${f.id}::uuid`).rejects.toThrow();
  await prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET state='RETRY_REQUESTED',attempts=2,regenerated=true,"retryShipmentOrderId"='SHIP_LOCAL',"retryPayId"='PAY_LOCAL_2',"retryQuoteDigest"='LOCAL' WHERE "orderId"=${f.id}::uuid`;
  await expect(prisma.$executeRaw`UPDATE "SupplierFundingExecution" SET "retryPayId"='PAY_LOCAL_3' WHERE "orderId"=${f.id}::uuid`).rejects.toThrow(/immutable/);
  await expect(prisma.$executeRaw`DELETE FROM "SupplierFundingExecution" WHERE "orderId"=${f.id}::uuid`).rejects.toThrow(/erased/);
  const acl=await prisma.$queryRaw`SELECT has_table_privilege('omnistu_app','"SupplierFundingExecution"','SELECT') canread,has_table_privilege('omnistu_app','"SupplierFundingExecution"','INSERT') canappend,has_table_privilege('omnistu_app','"SupplierFundingExecution"','UPDATE') canupdate,has_table_privilege('omnistu_app','"SupplierFundingExecution"','DELETE') canrewrite`;
  expect(acl).toEqual([{canread:true,canappend:true,canupdate:true,canrewrite:false}]);
 });
});
