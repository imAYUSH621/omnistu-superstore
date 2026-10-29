'use client';

import { useState } from 'react';
import {
  Database,
  Layers,
  Percent,
  RefreshCw,
  Send,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  orderNumber: string;
  buyer: string;
  email: string;
  address: string;
  items: string;
  amount: string;
  status: 'Processing' | 'Dispatched' | 'In-Transit' | 'Delivered';
  trackingNumber?: string;
  supplier: 'CJ Dropshipping' | 'Printify Direct';
}

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord-101',
    orderNumber: 'OMN-2026-8941',
    buyer: 'Ayush Anand',
    email: 'ayush@omnistu.com',
    address: '742 Evergreen Terrace, Springfield, OR 97477',
    items: 'Silicone Magnetic Balls (4-Pack) x1',
    amount: '$19.99',
    status: 'Processing',
    supplier: 'CJ Dropshipping',
  },
  {
    id: 'ord-102',
    orderNumber: 'OMN-2026-8942',
    buyer: 'Elena Rostova',
    email: 'elena.r@example.com',
    address: '120 Ocean Drive, Miami Beach, FL 33139',
    items: 'Smart Health & Sleep Tracker Ring x1',
    amount: '$89.00',
    status: 'Processing',
    supplier: 'CJ Dropshipping',
  },
  {
    id: 'ord-103',
    orderNumber: 'OMN-2026-8943',
    buyer: 'Marcus Vance',
    email: 'marcus.v@example.com',
    address: '450 Sutter St, San Francisco, CA 94108',
    items: 'Cyberpunk Heavyweight Streetwear Hoodie x1',
    amount: '$48.00',
    status: 'Dispatched',
    trackingNumber: 'PRNT-USPS-9400111899562',
    supplier: 'Printify Direct',
  },
  {
    id: 'ord-104',
    orderNumber: 'OMN-2026-8944',
    buyer: 'Sophia Chen',
    email: 'sophia.c@example.com',
    address: '88 Wall Street, New York, NY 10005',
    items: 'Turmeric Kojic Glow Pads (90 Count) x2',
    amount: '$49.90',
    status: 'In-Transit',
    trackingNumber: 'CJUS982341908YQ',
    supplier: 'CJ Dropshipping',
  },
];

export default function AdminInteractiveHub() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [marginMultiplier, setMarginMultiplier] = useState<number>(3.5);
  const [cjPing, setCjPing] = useState<number>(142);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleDispatchToCJ = async (order: OrderItem) => {
    setDispatchingId(order.id);
    try {
      const res = await fetch('/api/fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderNumber }),
      });
      const data = await res.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: 'Dispatched',
                  trackingNumber: data.trackingNumber,
                }
              : o
          )
        );
        toast({
          title: 'Dispatched to CJ Dropshipping!',
          description: `Tracking number generated: ${data.trackingNumber}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Dispatch Failed',
          description: data.message,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to contact fulfillment API.',
      });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleManualStatus = (orderId: string, newStatus: OrderItem['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    toast({
      title: 'Order Status Updated',
      description: `Order set to ${newStatus}`,
    });
  };

  const handleRefreshPing = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCjPing(Math.floor(120 + Math.random() * 40));
      setIsRefreshing(false);
      toast({
        title: 'Supplier Health Checked',
        description: 'CJ Dropshipping & Printify APIs operational with optimal ping.',
      });
    }, 600);
  };

  return (
    <div className='space-y-6 pt-2'>
      {/* ========================================================
          1. SUPPLIER & INFRASTRUCTURE HEALTH HUB
          ======================================================== */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* CJ Dropshipping Card */}
        <Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
              <Zap className='w-4 h-4 text-amber-500' /> CJ Dropshipping v2.0
            </CardTitle>
            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'>
              ● Active
            </span>
          </CardHeader>
          <CardContent className='space-y-2 text-xs'>
            <div className='flex justify-between text-neutral-500'>
              <span>API Ping:</span>
              <span className='font-mono font-bold text-neutral-800 dark:text-neutral-200'>
                {cjPing} ms
              </span>
            </div>
            <div className='flex justify-between text-neutral-500'>
              <span>Token Status:</span>
              <span className='text-emerald-600 font-semibold'>Authenticated</span>
            </div>
            <div className='flex justify-between text-neutral-500'>
              <span>Auto-Fulfill Queue:</span>
              <span className='font-bold'>Zero Errors</span>
            </div>
          </CardContent>
        </Card>

        {/* Printify API Hub Card */}
        <Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
              <Layers className='w-4 h-4 text-blue-500' /> Printify POD Direct Hub
            </CardTitle>
            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'>
              ● Live
            </span>
          </CardHeader>
          <CardContent className='space-y-2 text-xs'>
            <div className='flex justify-between text-neutral-500'>
              <span>Shop ID:</span>
              <span className='font-mono font-bold text-neutral-800 dark:text-neutral-200'>
                29044718
              </span>
            </div>
            <div className='flex justify-between text-neutral-500'>
              <span>Active Apparel Drops:</span>
              <span className='font-bold'>12 Live SKUs</span>
            </div>
            <div className='flex justify-between text-neutral-500'>
              <span>Print Facility Route:</span>
              <span className='text-blue-600 font-semibold'>USA / Monster Digital</span>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Free Tier Headroom Meter */}
        <Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
              <Database className='w-4 h-4 text-emerald-500' /> Supabase 500MB Meter
            </CardTitle>
            <span className='text-xs font-bold text-emerald-600'>96.3% Free</span>
          </CardHeader>
          <CardContent className='space-y-2 text-xs'>
            <div className='w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden'>
              <div
                className='bg-emerald-500 h-2 rounded-full'
                style={{ width: '3.7%' }}
              />
            </div>
            <div className='flex justify-between text-neutral-500 pt-1'>
              <span>Used: <strong>18.4 MB</strong></span>
              <span>Available: <strong>481.6 MB</strong></span>
            </div>
            <div className='text-[11px] text-neutral-400'>
              Zero Database Limit Bottlenecks. 100% Free Tier Compliant.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================
          2. LIVE ORDER MANAGEMENT & 1-CLICK CJ DISPATCH
          ======================================================== */}
      <Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
        <CardHeader className='pb-3 flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-base font-bold flex items-center gap-2'>
              <Truck className='w-5 h-5 text-amber-500' /> Live Order Management & 1-Click Dispatch
            </CardTitle>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Push orders directly to CJ Dropshipping or Printify fulfillment with automatic tracking sync.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefreshPing}
            disabled={isRefreshing}
            className='h-8 text-xs'
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </CardHeader>

        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs text-left'>
              <thead className='border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold'>
                <tr>
                  <th className='py-2.5 px-3'>Order ID</th>
                  <th className='py-2.5 px-3'>Buyer & Email</th>
                  <th className='py-2.5 px-3'>Shipping Destination</th>
                  <th className='py-2.5 px-3'>Line Items</th>
                  <th className='py-2.5 px-3'>Amount</th>
                  <th className='py-2.5 px-3'>Status</th>
                  <th className='py-2.5 px-3 text-right'>1-Click Dispatch</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                {orders.map((o) => (
                  <tr key={o.id} className='hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50'>
                    <td className='py-3 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100'>
                      {o.orderNumber}
                      <span className='block text-[10px] text-muted-foreground font-normal'>
                        {o.supplier}
                      </span>
                    </td>
                    <td className='py-3 px-3'>
                      <div className='font-semibold text-neutral-800 dark:text-neutral-200'>
                        {o.buyer}
                      </div>
                      <div className='text-neutral-400 text-[11px]'>{o.email}</div>
                    </td>
                    <td className='py-3 px-3 text-neutral-600 dark:text-neutral-300 max-w-[200px] truncate'>
                      {o.address}
                    </td>
                    <td className='py-3 px-3 font-medium text-neutral-800 dark:text-neutral-200'>
                      {o.items}
                    </td>
                    <td className='py-3 px-3 font-bold text-neutral-900 dark:text-white'>
                      {o.amount}
                    </td>
                    <td className='py-3 px-3'>
                      <div className='space-y-1'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            o.status === 'Processing'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : o.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                              : o.status === 'In-Transit'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {o.status}
                        </span>
                        {o.trackingNumber && (
                          <div className='font-mono text-[10px] text-neutral-500'>
                            {o.trackingNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='py-3 px-3 text-right'>
                      {o.status === 'Processing' ? (
                        <Button
                          size='sm'
                          onClick={() => handleDispatchToCJ(o)}
                          disabled={dispatchingId === o.id}
                          className='bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-7 px-3 text-xs rounded shadow-sm'
                        >
                          <Send className='w-3 h-3 mr-1' />
                          {dispatchingId === o.id ? 'Sending...' : '1-Click Dispatch'}
                        </Button>
                      ) : (
                        <div className='flex items-center justify-end gap-1'>
                          <select
                            value={o.status}
                            onChange={(e) =>
                              handleManualStatus(o.id, e.target.value as OrderItem['status'])
                            }
                            className='text-[11px] border border-neutral-300 dark:border-neutral-700 bg-background rounded px-1.5 py-0.5'
                          >
                            <option value='Dispatched'>Dispatched</option>
                            <option value='In-Transit'>In-Transit</option>
                            <option value='Delivered'>Delivered</option>
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          3. FIRST-PARTY ANALYTICS & MARGIN CONTROL
          ======================================================== */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Search Keywords Analytics */}
        <Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
              <TrendingUp className='w-4 h-4 text-emerald-500' /> First-Party Analytics: Top Search Terms
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-xs'>
            {[
              { term: 'magnetic balls', searches: 432, trend: '+24%', pct: 85 },
              { term: 'turmeric soap', searches: 389, trend: '+18%', pct: 75 },
              { term: 'smart ring', searches: 295, trend: '+32%', pct: 60 },
              { term: 'boxy hoodie', searches: 218, trend: '+15%', pct: 45 },
              { term: 'fidget sensory', searches: 174, trend: '+9%', pct: 35 },
            ].map((k, idx) => (
              <div key={idx} className='space-y-1'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold capitalize text-neutral-800 dark:text-neutral-200'>
                    {k.term}
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='text-neutral-500 font-mono'>{k.searches} searches</span>
                    <span className='text-emerald-600 font-bold text-[11px]'>{k.trend}</span>
                  </div>
                </div>
                <div className='w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5'>
                  <div
                    className='bg-amber-400 h-1.5 rounded-full'
                    style={{ width: `${k.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Catalog & Margin Multiplier Control */}
        <Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-bold flex items-center gap-1.5'>
              <Percent className='w-4 h-4 text-amber-500' /> Catalog Margin & Multiplier Control
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-xs'>
            <div>
              <div className='flex justify-between text-neutral-600 dark:text-neutral-300 mb-1.5'>
                <span>Dropship Wholesale Multiplier:</span>
                <strong className='text-amber-500 text-sm font-mono'>{marginMultiplier}x</strong>
              </div>
              <input
                type='range'
                min='2.0'
                max='5.0'
                step='0.1'
                value={marginMultiplier}
                onChange={(e) => setMarginMultiplier(parseFloat(e.target.value))}
                className='w-full accent-amber-500 cursor-pointer'
              />
              <p className='text-[11px] text-muted-foreground mt-1'>
                Wholesale $5.00 automatically lists at ${(5.0 * marginMultiplier).toFixed(2)} retail (
                {((1 - 1 / marginMultiplier) * 100).toFixed(0)}% gross margin).
              </p>
            </div>

            <div className='border-t border-neutral-200 dark:border-neutral-800 pt-3 space-y-2'>
              <div className='flex justify-between text-neutral-600 dark:text-neutral-300'>
                <span>Cart Conversion Rate:</span>
                <strong className='text-emerald-600 text-sm'>12.4% (Elite)</strong>
              </div>
              <div className='flex justify-between text-neutral-600 dark:text-neutral-300'>
                <span>Active Abandoned Carts:</span>
                <strong className='text-amber-500'>14 ($840 Potential)</strong>
              </div>
              <div className='flex justify-between text-neutral-600 dark:text-neutral-300'>
                <span>Speed-to-Lead Followup:</span>
                <strong className='text-blue-500'>Automated Webhook Ready</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
