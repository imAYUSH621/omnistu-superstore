import AccountSupportText from '@/components/shared/account-support-text';
import {accountSupportMetadata} from '@/lib/account-support-metadata';
import { redirect } from 'next/navigation';
import {currentCustomer} from '@/lib/foundation/current-customer-server';
import { prisma } from '@/db/prisma';
import { listEnquiriesForUser } from '@/lib/enquiries';

export async function generateMetadata(){return accountSupportMetadata();}
export const dynamic = 'force-dynamic';

type Row = { id: string; serviceSlug: string | null; message: string; status: string; createdAt: Date };

export default async function MyEnquiriesPage() {
  const identity=await currentCustomer();
  if(identity.status==='guest'||identity.status==='not-found')redirect('/sign-in?callbackUrl=/user/enquiries');
  if(identity.status!=='authenticated')return <p role='alert'><AccountSupportText name='identityUnavailable'/></p>;
  let rows: Row[] = [];
  let failed = false;
  try {
    rows = (await listEnquiriesForUser((a) => prisma.serviceEnquiry.findMany(a as never) as never, identity.customer.customerId)) as Row[];
  } catch {
    failed = true;
  }
  return (
    <div className='space-y-3'>
      <h2 className='h2-bold'><AccountSupportText name='enquiries'/></h2>
      <p className='text-sm text-muted-foreground'>
        <AccountSupportText name='privacy'/>
      </p>
      {failed ? (
        <p role='alert' className='rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800'>
          <AccountSupportText name='unavailable'/>
        </p>
      ) : rows.length === 0 ? (
        <p className='rounded border p-3 text-sm'><AccountSupportText name='empty'/></p>
      ) : (
        <ul className='space-y-3'>
          {rows.map((r) => (
            <li key={r.id} className='space-y-1 rounded border p-3 text-sm'>
              <p className='text-xs text-muted-foreground'>
                {r.serviceSlug ?? <AccountSupportText name='general'/>} - <AccountSupportText status={r.status}/> - {r.createdAt.toISOString().slice(0, 10)}
              </p>
              <p className='whitespace-pre-wrap break-words'>{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
