import{notFound,redirect}from 'next/navigation';
import{currentCustomer}from '@/lib/foundation/current-customer-server';
import{localBillingConfig,readLocalBilling}from '@/lib/foundation/killbill-local-test';
export const dynamic='force-dynamic';
export const metadata={title:'Private billing test',robots:{index:false,follow:false}};
export default async function LocalBillingPage(){
 if(!localBillingConfig())notFound();
 const billing=await readLocalBilling(await currentCustomer());if(billing.status==='guest')redirect('/sign-in?callbackUrl=/user/billing');
 return <main className='max-w-3xl mx-auto space-y-5 min-w-0'>
 <aside className='border border-amber-400 bg-amber-50 text-amber-950 p-4 rounded-lg text-sm'>PRIVATE LOCAL TEST ONLY. Synthetic billing records, not a bill or payment request. No checkout, subscription, charge, email or payment service is connected.</aside>
 <h1 className='text-2xl font-bold'>Billing test</h1>
 {billing.status==='ready'?<><p className='text-sm'>This view uses your signed-in Store account. No second customer login.</p>
 <dl className='grid grid-cols-1 sm:grid-cols-2 gap-3'><div className='border rounded-lg p-4'><dt>Recorded account balance</dt><dd className='font-semibold'>{billing.currency} {billing.balance}</dd></div><div className='border rounded-lg p-4'><dt>Recorded credit</dt><dd className='font-semibold'>{billing.currency} {billing.credit}</dd></div></dl>
 <h2 className='text-xl font-semibold'>Synthetic invoices</h2>{billing.invoices.length===0?<p>No synthetic invoices recorded.</p>:<ul className='space-y-3'>{billing.invoices.map(i=><li key={i.id} className='border rounded-lg p-4 space-y-2'><p className='font-semibold'>{i.status==='DRAFT'?'Draft - not issued':i.status==='VOID'?'Void':'Recorded invoice - test only'}</p><p>Date: {i.date}</p><p>Recorded amount: {i.currency} {i.amount}</p><p>Recorded balance: {i.currency} {i.balance}</p><p className='text-xs break-all'>Test reference: {i.id}</p></li>)}</ul>}</>:<p role='status'>{billing.status==='not-linked'?'No billing account is linked to this Store account. This page does not create one.':'Billing is temporarily unavailable. An error is not an empty invoice history.'}</p>}
 </main>
}
