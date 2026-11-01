import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllReturns } from '@/lib/actions/return.actions';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ReturnReviewButtons from '@/components/admin/return-review-buttons';

export const metadata: Metadata = { title: 'Admin Returns' };

type ReturnRow = {
  id: string;
  reason: string;
  status: string;
  refundAmount: string | number | null;
  refundStatus: string | null;
  supplierReturnStatus: string | null;
  resolutionNote: string | null;
  createdAt: string;
  order: { id: string; totalPrice: string | number; isPaid: boolean; dispatchSupplier: string | null; createdAt: string };
  user: { email: string; name: string | null };
};

const AdminReturnsPage = async () => {
  await requireAdmin();
  const res = await getAllReturns();
  const returns = (res.data || []) as ReturnRow[];

  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>Returns &amp; RMA</h1>
      <p className='text-sm text-muted-foreground max-w-2xl'>
        Test mode: approving a return records a <b>SIMULATED</b> refund only. No payment
        provider is called and no money moves. Supplier returns are tracked as a
        status and must be initiated manually until supplier API scope is settled.
      </p>
      {returns.length === 0 ? (
        <p className='text-sm text-muted-foreground pt-4'>No return requests yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Refund</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatId(r.id)}</TableCell>
                <TableCell>{formatId(r.order.id)} ({formatCurrency(Number(r.order.totalPrice))})</TableCell>
                <TableCell>{r.user.email}</TableCell>
                <TableCell className='max-w-[220px] truncate' title={r.reason}>{r.reason}</TableCell>
                <TableCell>
                  <Badge variant={r.status === 'REQUESTED' ? 'outline' : r.status === 'APPROVED' ? 'default' : 'destructive'}>
                    {r.status}
                  </Badge>
                  {r.supplierReturnStatus === 'PENDING_MANUAL' && (
                    <span className='block text-[11px] text-amber-600 mt-1'>supplier RMA: manual</span>
                  )}
                </TableCell>
                <TableCell>
                  {r.refundStatus ? `${r.refundStatus}${r.refundAmount ? ` ${formatCurrency(Number(r.refundAmount))}` : ''}` : '-'}
                </TableCell>
                <TableCell>{formatDateTime(new Date(r.createdAt)).dateTime}</TableCell>
                <TableCell>
                  {r.status === 'REQUESTED' ? (
                    <ReturnReviewButtons returnId={r.id} />
                  ) : (
                    <span className='text-xs text-muted-foreground'>{r.resolutionNote || 'resolved'}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminReturnsPage;
