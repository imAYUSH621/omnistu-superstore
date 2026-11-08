/** TESTONLY, isolated Store integration. No provider clients, publication, cron or customer effects. */
import type {PgBoss} from 'pg-boss';
type QueueDb={executeSql:(text:string,values?:unknown[])=>Promise<{rows:Record<string,unknown>[]}>};
import {prepareQualifiedCatalogRow} from './qualified-catalog-plan';
type Tx={ $queryRawUnsafe:<T=unknown>(sql:string,...values:unknown[])=>Promise<T>; $executeRawUnsafe:(sql:string,...values:unknown[])=>Promise<number> };
type Database={ $transaction:<T>(fn:(tx:Tx)=>Promise<T>,options?:{timeout:number})=>Promise<T> };
export const CATALOG_JOB_QUEUE='catalog-prepare-test';
export const CATALOG_QUEUE_AUTONOMY=false;
export function catalogQueueContext(env:NodeJS.ProcessEnv=process.env){
 let url:URL;try{url=new URL(env.DATABASE_URL??'')}catch{throw Error('ISOLATED_CATALOG_QUEUE_ONLY')}
 if(env.RETAIL_FLOW_LOCAL_SIMULATION==='true'&&env.NODE_ENV!=='production'&&['localhost','127.0.0.1'].includes(url.hostname)&&url.searchParams.get('schema')==='itest_catalog_preparation_20261107')return{schema:'itest_catalog_preparation_20261107',queueSchema:'itest_catalog_jobs',hosted:false};
 if(env.CATALOG_QUEUE_HOSTED_QUALIFICATION==='true'&&env.VERCEL_ENV==='preview'&&env.TEST_CHECKOUT_MODE==='true'&&url.hostname==='aws-0-ap-south-1.pooler.supabase.com'&&url.port==='5432'&&url.pathname==='/postgres'&&decodeURIComponent(url.username)==='retail_v2_preview_runtime_20261105.fvvfycodxpyrsvdynuzv'&&url.searchParams.get('sslmode')==='require'&&url.searchParams.get('schema')==='itest_catalog_queue_20261107')return{schema:'itest_catalog_queue_20261107',queueSchema:'itest_catalog_queue_jobs_20261107',hosted:true};
 throw Error('ISOLATED_CATALOG_QUEUE_ONLY');
}
export function assertLocalCatalogQueue(env:NodeJS.ProcessEnv=process.env){if(catalogQueueContext(env).hosted)throw Error('LOCAL_CATALOG_QUEUE_ONLY')}
/** Custom parameterized adapter, qualified against actual Prisma6 below; not official Prisma7 adapter. */
export function prisma6CatalogQueueTransaction(tx:Tx):QueueDb{return {async executeSql(text,values){return {rows:await tx.$queryRawUnsafe<Record<string,unknown>[]>(text,...(values??[]))}}};}
export async function openLocalCatalogQueue(){
 const context=catalogQueueContext();const [major,minor]=process.versions.node.split('.').map(Number);if(major<22||(major===22&&minor<12))throw Error('QUEUE_RUNTIME_REQUIRES_NODE_22_12');const {PgBoss}=await import('pg-boss');
 const u=new URL(process.env.DATABASE_URL!);u.searchParams.delete('schema');u.searchParams.delete('connection_limit');u.searchParams.delete('pool_timeout');if(context.hosted)u.searchParams.set('uselibpqcompat','true');
 const boss=new PgBoss({connectionString:u.toString(),schema:context.queueSchema,supervise:false,schedule:false,migrate:!context.hosted,registerInstance:false,max:1,connectionTimeoutMillis:10000});
 boss.on('error',()=>{console.error('CATALOG_QUEUE_DATABASE_ERROR')});try{await boss.start();if(!context.hosted)await boss.createQueue(CATALOG_JOB_QUEUE,{policy:'exclusive',retryLimit:1,retryDelay:0,expireInSeconds:30});return boss}catch(e){await boss.stop({graceful:false}).catch(()=>{});throw e}
}
async function assertSchema(tx:Tx){const [x]=await tx.$queryRawUnsafe<{schema:string}[]>('SELECT current_schema() schema');if(x?.schema!==catalogQueueContext().schema)throw Error('LOCAL_CATALOG_QUEUE_ONLY')}
function validId(id:string){if(!/^[a-f0-9]{64}$/.test(id))throw Error('INVALID_PREPARATION_ID')}
export async function enqueueCatalogPreparation(tx:Tx,boss:PgBoss,preparationId:string){
 catalogQueueContext();validId(preparationId);await assertSchema(tx);
 const rows=await tx.$queryRawUnsafe<{id:string}[]>('SELECT id FROM "QualifiedCatalogPreparation" WHERE id=$1',preparationId);
 if(rows.length!==1)throw Error('ORIGINAL_EVIDENCE_REQUIRED');
 const done=await tx.$queryRawUnsafe<{preparationId:string}[]>('SELECT "preparationId" FROM "CatalogPreparationJobResult" WHERE "preparationId"=$1',preparationId);
 if(done.length)return{status:'ALREADY_PROCESSED' as const,jobId:null};
 const jobId=await boss.send(CATALOG_JOB_QUEUE,{preparationId},{singletonKey:preparationId,db:prisma6CatalogQueueTransaction(tx)});
 return{status:jobId?'QUEUED' as const:'ALREADY_QUEUED' as const,jobId};
}
/** Same transaction for result ledger and queue completion. Only preparation results are written. */
export async function processCatalogPreparationJobs(db:Database,boss:PgBoss,opts:{allowRun:boolean;limit:number;now:Date;maxAgeMs:number}){
 catalogQueueContext();if(!opts.allowRun)return{skipped:true,processed:0};
 if(!Number.isInteger(opts.limit)||opts.limit<1||opts.limit>10||!Number.isFinite(opts.now.getTime())||!Number.isFinite(opts.maxAgeMs)||opts.maxAgeMs<=0)throw Error('INVALID_QUEUE_BOUNDS');
 let processed=0;
 for(let i=0;i<opts.limit;i++){
  // Claim inside the same bounded transaction, so crash/rollback releases the claim.
  const found=await db.$transaction(async tx=>{
   await assertSchema(tx);const adapter=prisma6CatalogQueueTransaction(tx);const [job]=await boss.fetch<{preparationId:string}>(CATALOG_JOB_QUEUE,{db:adapter});if(!job)return false;
   const p=job.data;if(!p||Object.keys(p).length!==1||typeof p.preparationId!=='string')throw Error('INVALID_JOB_PAYLOAD');validId(p.preparationId);
   const rows=await tx.$queryRawUnsafe<{input:unknown}[]>('SELECT input FROM "QualifiedCatalogPreparation" WHERE id=$1',p.preparationId);if(rows.length!==1)throw Error('ORIGINAL_EVIDENCE_REQUIRED');
   const raw=rows[0].input as Omit<Parameters<typeof prepareQualifiedCatalogRow>[0],'now'|'maxAgeMs'>;
   const result=prepareQualifiedCatalogRow({...raw,now:opts.now,maxAgeMs:opts.maxAgeMs});
   await tx.$executeRawUnsafe('INSERT INTO "CatalogPreparationJobResult" ("preparationId",status,result) VALUES ($1,$2,$3::jsonb) ON CONFLICT ("preparationId") DO NOTHING',p.preparationId,result.status,JSON.stringify(result));
   await boss.complete(CATALOG_JOB_QUEUE,job.id,undefined,{db:adapter});return true;
  },{timeout:10000});
  if(!found)break;processed++;
 }
 return{skipped:false,processed};
}
