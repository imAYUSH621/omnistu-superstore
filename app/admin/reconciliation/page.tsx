import { getPaidOrderReconciliation } from '@/lib/actions/reconcile.actions';

export const metadata = { title: 'Paid order reconciliation' };
export const dynamic = 'force-dynamic';

export default async function ReconciliationPage() {
  const res = await getPaidOrderReconciliation();
  if (!res.success) return <p className="p-4">{res.message}</p>;
  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Paid orders needing attention</h1>
      <p className="text-sm text-muted-foreground">
        Read-only. Paid orders with no dispatch record (after 15 minutes) or a dispatch that is not complete.
        The supplier outcome is unknown for these: do not retry automatically. Check the supplier dashboard
        first, and dispatch manually only if no supplier order exists.
      </p>
      {res.items.length === 0 ? (
        <p>None found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Order</th><th>Paid at</th><th>Reason</th><th>Dispatch status</th><th>Error</th><th>Supplier order</th>
            </tr>
          </thead>
          <tbody>
            {res.items.map((i) => (
              <tr key={i.orderId} className="border-t">
                <td>{i.orderId}</td><td>{i.paidAt ?? ''}</td><td>{i.reason}</td>
                <td>{i.dispatchStatus ?? ''}</td><td>{i.dispatchError ?? ''}</td><td>{i.supplierOrderId ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
