import{localDatabaseTestEnabled}from './helpers/local-database';
import{prisma}from '@/db/prisma';
import{enqueueFulfillmentTask,processDueFulfillmentTasks}from '@/lib/fulfillment-queue';
const suite=localDatabaseTestEnabled()?describe:describe.skip;
suite('manual fulfillment claims on disposable real Postgres; inert runner only',()=>{
 let userId:string,orderId:string;const suffix=Date.now().toString(36);
 beforeAll(async()=>{const u=await prisma.user.create({data:{name:'Queue race test',email:`queue-race-${suffix}@example.invalid`,password:'not-a-login',role:'user'}});userId=u.id;const o=await prisma.order.create({data:{userId,shippingAddress:{},paymentMethod:'TestPayment',itemsPrice:0,shippingPrice:0,taxPrice:0,totalPrice:0}});orderId=o.id},30000);
 afterEach(async()=>{jest.restoreAllMocks();await prisma.fulfillmentTask.deleteMany({where:{orderId}})});
 afterAll(async()=>{await prisma.order.deleteMany({where:{id:orderId}});await prisma.user.deleteMany({where:{id:userId}});await prisma.$disconnect()},30000);
 it('simultaneous enqueue calls leave one active task for the same order and supplier',async()=>{
  const results=await Promise.all(Array.from({length:8},()=>enqueueFulfillmentTask({orderId,supplier:'INERT_TEST',payload:{testOnly:true}})));
  const tasks=await prisma.fulfillmentTask.findMany({where:{orderId,supplier:'INERT_TEST'}});
  expect(tasks).toHaveLength(1);expect(new Set(results.map(r=>r.id)).size).toBe(1);expect(results.filter(r=>!r.deduplicated)).toHaveLength(1);
 });
 it('two drains selecting the same due row invoke the inert runner once',async()=>{
  await enqueueFulfillmentTask({orderId,supplier:'INERT_TEST',payload:{testOnly:true}});
  // Synchronize two real database SELECT results to reproduce an overlapping drain.
  const original=prisma.fulfillmentTask.findMany.bind(prisma.fulfillmentTask);let selected=0;let release!:()=>void;const barrier=new Promise<void>(resolve=>{release=resolve});
  jest.spyOn(prisma.fulfillmentTask,'findMany').mockImplementation((async(args:Parameters<typeof original>[0])=>{const rows=await original(args);selected++;if(selected===2)release();await barrier;return rows})as typeof original);
  const runner=jest.fn(async()=>undefined);
  const results=await Promise.all([processDueFulfillmentTasks(runner,{allowRun:true,limit:1}),processDueFulfillmentTasks(runner,{allowRun:true,limit:1})]);
  expect(runner).toHaveBeenCalledTimes(1);expect(results.reduce((n,r)=>n+r.processed,0)).toBe(1);
  expect((await prisma.fulfillmentTask.findFirstOrThrow({where:{orderId}})).status).toBe('SUCCEEDED');
 },30000);
 it('failed acknowledgement leaves PROCESSING held and does not retry or enqueue another active task',async()=>{
  const task=await enqueueFulfillmentTask({orderId,supplier:'INERT_TEST',payload:{testOnly:true}});
  jest.spyOn(prisma.fulfillmentTask,'update').mockRejectedValueOnce(Error('synthetic acknowledgement failure'));
  const runner=jest.fn(async()=>undefined);
  await expect(processDueFulfillmentTasks(runner,{allowRun:true,limit:1})).rejects.toThrow('synthetic acknowledgement failure');
  expect((await prisma.fulfillmentTask.findUniqueOrThrow({where:{id:task.id}})).status).toBe('PROCESSING');
  expect(await processDueFulfillmentTasks(runner,{allowRun:true,limit:1})).toMatchObject({processed:0,failed:0});
  expect(await enqueueFulfillmentTask({orderId,supplier:'INERT_TEST',payload:{testOnly:true}})).toEqual({id:task.id,deduplicated:true});
  expect(runner).toHaveBeenCalledTimes(1);
 });
 it('runner exception retains bounded failure record, not a successful acknowledgement',async()=>{
  const task=await enqueueFulfillmentTask({orderId,supplier:'INERT_TEST',payload:{testOnly:true},maxAttempts:1});
  const result=await processDueFulfillmentTasks(async()=>{throw Error('inert test exception')},{allowRun:true,limit:1});
  expect(result).toMatchObject({processed:0,failed:1});
  expect(await prisma.fulfillmentTask.findUniqueOrThrow({where:{id:task.id}})).toMatchObject({status:'FAILED_EXCEPTION',attempts:1,lastError:'inert test exception'});
 });
 it('enqueue inside a caller transaction rolls back with the caller',async()=>{
  await expect(prisma.$transaction(async tx=>{await enqueueFulfillmentTask({orderId,supplier:'INERT_TEST',payload:{testOnly:true},tx});throw Error('synthetic rollback')})).rejects.toThrow('synthetic rollback');
  expect(await prisma.fulfillmentTask.count({where:{orderId}})).toBe(0);
 });

});
