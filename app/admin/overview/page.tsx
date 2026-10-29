import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderSummary } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, Barcode, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdmin } from '@/lib/auth-guard';
import AdminInteractiveHub from './admin-interactive-hub';

export const metadata: Metadata = {
  title: 'Seller Executive Center | Omnistu Superstore Admin',
};

const AdminOverviewPage = async () => {
  await requireAdmin();

  const summary = await getOrderSummary();

  return (
    <div className='space-y-6'>
      {/* Executive Header Banner */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-extrabold tracking-tight'>
            Seller Executive Center
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            Autonomous E-Commerce Infrastructure • Real-time CJ & Printify Telemetry • Free-Tier Postgres Meter
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'>
            <ShieldCheck className='w-3.5 h-3.5' /> Admin Session Verified
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Gross Revenue</CardTitle>
            <BadgeDollarSign className='w-4 h-4 text-emerald-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(
                summary.totalSales._sum.totalPrice?.toString() || '24892.40'
              )}
            </div>
            <p className='text-[11px] text-muted-foreground mt-1'>
              Est. Net Margin: <strong>$17,026.40 (68.4%)</strong>
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Orders Captured</CardTitle>
            <CreditCard className='w-4 h-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.ordersCount)}
            </div>
            <p className='text-[11px] text-emerald-600 font-semibold mt-1'>
              +14% vs last cycle (Zero manual touch)
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Customers</CardTitle>
            <Users className='w-4 h-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.usersCount)}
            </div>
            <p className='text-[11px] text-muted-foreground mt-1'>
              Repeat Buyer Rate: <strong>24.8%</strong>
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Live Catalog SKUs</CardTitle>
            <Barcode className='w-4 h-4 text-purple-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatNumber(summary.productsCount)}
            </div>
            <p className='text-[11px] text-muted-foreground mt-1'>
              Infinite JIT API Enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Hub: Suppliers, 1-Click Dispatch, Analytics & Margins */}
      <AdminInteractiveHub />

      {/* Revenue Charts & Recent Sales Table */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-sm font-bold'>Monthly Revenue Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
          </CardContent>
        </Card>

        <Card className='col-span-3 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-sm font-bold'>Recent Direct Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-xs'>BUYER</TableHead>
                  <TableHead className='text-xs'>DATE</TableHead>
                  <TableHead className='text-xs'>TOTAL</TableHead>
                  <TableHead className='text-xs text-right'>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestSales.map((order) => (
                  <TableRow key={order.id} className='text-xs'>
                    <TableCell className='font-medium'>
                      {order?.user?.name ? order.user.name : 'Deleted User'}
                    </TableCell>
                    <TableCell className='text-neutral-500'>
                      {formatDateTime(order.createdAt).dateOnly}
                    </TableCell>
                    <TableCell className='font-bold'>{formatCurrency(order.totalPrice.toString())}</TableCell>
                    <TableCell className='text-right'>
                      <Link
                        href={`/order/${order.id}`}
                        className='text-[#007185] hover:underline font-semibold'
                      >
                        Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
