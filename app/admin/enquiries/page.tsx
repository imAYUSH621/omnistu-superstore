import { prisma } from '@/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata = { title: 'Support and service enquiries' };
export const dynamic = 'force-dynamic';

export default async function EnquiriesPage() {
  await requireAdmin();
  let rows: { id: string; serviceSlug: string | null; name: string; email: string; message: string; status: string; createdAt: Date }[] = [];
  let failed = false;
  try {
    rows = await prisma.serviceEnquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  } catch {
    failed = true;
  }
  return (
    <div className='space-y-4'>
      <h1 className='h2-bold'>Support and service enquiries</h1>
      <p className='text-sm text-muted-foreground'>Read-only store inbox: the latest 100 saved support and service enquiries. Saving an enquiry does not send email or confirm a team reply.</p>
      {failed ? (
        <p role='alert' className='rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800'>
          Enquiries could not be loaded. The database may not be configured or migrated.
        </p>
      ) : rows.length === 0 ? (
        <p className='rounded border p-3 text-sm'>No enquiries yet.</p>
      ) : (
        <ul className='space-y-3'>
          {rows.map((r) => (
            <li key={r.id} className='space-y-1 rounded border p-3 text-sm'>
              <p className='font-medium'>
                {r.name} <span className='font-normal break-all'>({r.email})</span>
              </p>
              <p className='text-xs text-muted-foreground'>
                {r.serviceSlug ?? 'general'} - {r.status} - {r.createdAt.toISOString().slice(0, 16).replace('T', ' ')} UTC
              </p>
              <p className='whitespace-pre-wrap break-words'>{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
