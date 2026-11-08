import {requireAdmin} from '@/lib/auth-guard';
import {catalogPreparationAvailable,runCatalogPreparation} from '@/lib/catalog-preparation-workflow';
import {enqueuePreparation,processPreparation} from '@/lib/actions/catalog-preparation.actions';
import {Button} from '@/components/ui/button';
export const dynamic='force-dynamic';
export const metadata={title:'Catalog preparation'};
export default async function CatalogPreparationPage(){
 await requireAdmin();
 const available=catalogPreparationAvailable();
 let rows:{id:string;status:string;reasons:string[]|null}[]=[];let failed=false;
 if(available){try{const state=await runCatalogPreparation({action:'status'});if(state.action==='status')rows=state.rows;}catch{failed=true;}}
 return <div className='space-y-4'>
  <h1 className='h2-bold'>Catalog preparation</h1>
  <p className='text-sm text-muted-foreground'>Manual pg-boss preparation pilot. It reads existing retained inputs and records a preparation result. It does not publish products, choose retail prices, order stock, contact suppliers, take payments or send email.</p>
  {!available?<p role='status' className='rounded border p-4'>Not enabled in this environment. This pilot is restricted to the existing isolated TESTONLY workflow. Public Store catalog publication remains off.</p>:failed?<p role='alert' className='rounded border border-red-300 p-4'>Preparation records could not be loaded. No fallback catalog or automatic retry was started.</p>:<>
   <p className='rounded border border-amber-400 p-3 text-sm'>TESTONLY. PREPARED_ONLY is not publication approval. Reference strings are not proof of source authority. Commercial evidence, product assets and owner approvals need independent review before any later publication.</p>
   <form action={processPreparation}><Button type='submit'>Process at most one queued record</Button></form>
   {!rows.length?<p>No retained preparation inputs.</p>:<ul className='space-y-3'>{rows.map(row=><li key={row.id} className='space-y-2 rounded border p-3 text-sm'>
    <p className='break-all font-mono text-xs'>{row.id}</p><p className='font-semibold'>{row.status}</p>
    {row.reasons?.length?<p className='break-words'>Hold reasons: {row.reasons.join(', ')}</p>:null}
    {row.status==='NOT_PROCESSED'?<form action={enqueuePreparation}><input type='hidden' name='preparationId' value={row.id}/><Button type='submit' variant='outline'>Queue this retained record</Button></form>:<p className='text-muted-foreground'>Already processed. Replay does not create another result.</p>}
   </li>)}</ul>}
  </>}
 </div>;
}
