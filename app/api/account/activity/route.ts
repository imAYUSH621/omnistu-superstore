import {NextResponse} from 'next/server';
import {currentAccountActivity} from '@/lib/foundation/account-activity-server';
export const dynamic='force-dynamic';
/** No request identity selectors or side effects. Current session is the only identity source. */
export async function GET(){
 const activity=await currentAccountActivity(),headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
 if(activity.status==='guest')return NextResponse.json({error:'Authentication required'},{status:401,headers});
 if(activity.status!=='available')return NextResponse.json({error:'Account temporarily unavailable'},{status:503,headers});
 return NextResponse.json({activity},{headers});
}
