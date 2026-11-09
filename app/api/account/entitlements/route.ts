import{NextResponse}from 'next/server';
import{currentCustomer}from '@/lib/foundation/current-customer-server';
import{localBillingConfig}from '@/lib/foundation/killbill-local-test';
import{readLocalEntitlements}from '@/lib/foundation/killbill-local-entitlements';
export const dynamic='force-dynamic';
export async function GET(){
 if(!localBillingConfig())return NextResponse.json({error:'Not found'},{status:404,headers:{'Cache-Control':'private, no-store',Vary:'Cookie'}});
 const entitlements=await readLocalEntitlements(await currentCustomer());
 return NextResponse.json({entitlements},{status:entitlements.status==='guest'?401:entitlements.status==='unavailable'?503:200,headers:{'Cache-Control':'private, no-store',Vary:'Cookie'}});
}
