import{NextResponse}from 'next/server';
import{currentCustomer}from '@/lib/foundation/current-customer-server';
import{readLocalBilling}from '@/lib/foundation/killbill-local-test';
export const dynamic='force-dynamic';
export async function GET(){const billing=await readLocalBilling(await currentCustomer());const headers={'Cache-Control':'private, no-store',Vary:'Cookie'};return NextResponse.json({billing},{status:billing.status==='guest'?401:billing.status==='unavailable'?503:200,headers})}
