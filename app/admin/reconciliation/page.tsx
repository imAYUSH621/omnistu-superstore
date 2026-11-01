import { getPaidOrderReconciliation, getOversoldProducts } from '@/lib/actions/reconcile.actions';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata = { title: 'Paid order reconciliation' };
export const dynamic = 'force-dynamic';

const fmt = (iso: string | null) => (iso ? `${iso.slice(0, 16).replace('T', ' ')} UTC` : 'unknown');
const reasonText = (r: string) =>
  r === 'NO_DISPATCH_RECORD' ? 'No dispatch record' : 'Dispatch not complete';

export default async function ReconciliationPage({ searchParams }: { searchParams?: Promise<{ after?: string }> }) {
  await requireAdmin(); // same guard as the other admin pages (non-admins go to /unauthorized)
  const sp = (await searchParams) ?? {};
  const res = await getPaidOrderReconciliation(sp.after);
  const oversold = await getOversoldProducts();
  if (!res.success) {
    return (
      <div className="space-y-2">
        <h1 className="h2-bold">Paid orders needing attention</h1>
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {res.message}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Paid orders needing attention</h1>
      <p className="text-sm text-muted-foreground">
        Read-only. Paid orders with no dispatch record (after 15 minutes) or a dispatch that is not complete.
        The supplier outcome is unknown for these: do not retry automatically. Check the supplier dashboard
        first, and dispatch manually only if no supplier order exists.
      </p>
      {res.items.length === 0 && !res.nextToken ? (
        <p className="rounded border p-3 text-sm">{sp.after ? 'No more paid orders on this page.' : 'No paid orders need attention.'}</p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {res.items.map((i) => (
              <li key={i.orderId} className="space-y-1 rounded border p-3 text-sm">
                <p className="break-all font-medium">{i.orderId}</p>
                <p>{reasonText(i.reason)}</p>
                <p>Paid at: {fmt(i.paidAt)}</p>
                <p>Dispatch status: {i.dispatchStatus ?? 'none'}</p>
                {i.supplierOrderId && <p className="break-all">Supplier order: {i.supplierOrderId}</p>}
                {i.dispatchError && <p className="break-words">Error: {i.dispatchError}</p>}
              </li>
            ))}
          </ul>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="text-left">
                <th className="p-2">Order</th><th className="p-2">Paid at</th><th className="p-2">Reason</th>
                <th className="p-2">Dispatch status</th><th className="p-2">Error</th><th className="p-2">Supplier order</th>
              </tr>
            </thead>
            <tbody>
              {res.items.map((i) => (
                <tr key={i.orderId} className="border-t align-top">
                  <td className="break-all p-2">{i.orderId}</td>
                  <td className="whitespace-nowrap p-2">{fmt(i.paidAt)}</td>
                  <td className="p-2">{reasonText(i.reason)}</td>
                  <td className="p-2">{i.dispatchStatus ?? 'none'}</td>
                  <td className="break-words p-2">{i.dispatchError ?? ''}</td>
                  <td className="break-all p-2">{i.supplierOrderId ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {res.nextToken && (
        <p className="text-sm">
          More paid orders need attention.{' '}
          <a className="underline" href={`/admin/reconciliation?after=${res.nextToken}`}>Next page</a>
          . Pages follow the order id, not the paid time; each page is sorted by paid time. Orders can change while you page, so start again from page 1 for a fresh list.
        </p>
      )}
      {oversold.success && oversold.items.length > 0 && (
        <section className="space-y-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm" aria-label="Oversold products">
          <h2 className="font-semibold">Oversold products (stock below zero)</h2>
          <p>
            More units were paid for than were in stock. This list is read-only and changes nothing: decide per product
            whether to refund, backorder or re-source.
          </p>
          {oversold.truncated && <p className="font-medium">Showing the 100 lowest-stock products; more are oversold.</p>}
          <ul className="space-y-1">
            {oversold.items.map((p) => (
              <li key={p.slug} className="break-words">
                {p.name} <span className="text-muted-foreground">({p.slug})</span>: <strong>{p.stock}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
