import {catalogQueueContext,openLocalCatalogQueue,enqueueCatalogPreparation,processCatalogPreparationJobs} from '@/lib/catalog-job-queue';
import {prisma} from '@/db/prisma';
export type CatalogPreparationCommand={action:'status'}|{action:'enqueue';preparationId:string}|{action:'drain'};
/** Shared by the admin page and the protected TESTONLY qualification surface.
 * This is preparation only, never a catalog writer or an approval interpreter. */
export async function runCatalogPreparation(command:CatalogPreparationCommand){
 const context=catalogQueueContext();
 if(command.action==='status'){
  const rows=await prisma.$transaction(async tx=>{
   const [identity]=await tx.$queryRawUnsafe<{schema:string;role:string}[]>('SELECT current_schema() schema,current_user role');
   if(identity?.schema!==context.schema)throw Error('ISOLATED_CATALOG_QUEUE_ONLY');
   return tx.$queryRawUnsafe<{id:string;status:string;reasons:string[]|null}[]>('SELECT p.id,COALESCE(r.status,\'NOT_PROCESSED\') status, r.result->\'reasons\' reasons FROM "QualifiedCatalogPreparation" p LEFT JOIN "CatalogPreparationJobResult" r ON r."preparationId"=p.id ORDER BY p.id LIMIT 50');
  });
  return {action:'status' as const,rows,scope:'isolated-test-only',published:false as const};
 }
 const boss=await openLocalCatalogQueue();
 try{
  if(command.action==='enqueue')return {...await prisma.$transaction(tx=>enqueueCatalogPreparation(tx,boss,command.preparationId),{timeout:10000}),action:'enqueue' as const,published:false as const};
  return {...await processCatalogPreparationJobs(prisma,boss,{allowRun:true,limit:1,now:new Date(),maxAgeMs:600000}),action:'drain' as const,published:false as const};
 }finally{await boss.stop({graceful:false})}
}
export function catalogPreparationAvailable(env:NodeJS.ProcessEnv=process.env):boolean{
 try{catalogQueueContext(env);return true}catch{return false}
}
