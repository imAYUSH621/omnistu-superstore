import {NextResponse} from 'next/server';
import {currentCustomer} from '@/lib/foundation/current-customer-server';
export const dynamic='force-dynamic';
export async function GET(){
 const identity=await currentCustomer();
 const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
 if(identity.status==='guest'||identity.status==='not-found')return NextResponse.json({error:'Authentication required'},{status:401,headers});
 if(identity.status!=='authenticated')return NextResponse.json({error:'Account temporarily unavailable'},{status:503,headers});
 return NextResponse.json({account:identity.customer},{headers});
}
