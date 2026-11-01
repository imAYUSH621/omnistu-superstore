import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

/**
 * Supplier + sales health for the admin dashboard.
 * Only verifiable values are reported (D6/D7): env configuration flags and
 * real database aggregates. No fabricated ping times, quotas, revenue or
 * keyword numbers. Live supplier reachability is NOT probed here, so
 * configured means "credentials present", not "credentials valid".
 */
export async function GET() {
  const cjConfigured = Boolean(process.env.CJ_API_KEY || process.env.FULFILLMENT_API_KEY);
  const printifyConfigured = Boolean(process.env.PRINTIFY_API || process.env.PRINTIFY_API_TOKEN);
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL);

  let sales: { totalRevenue: number; totalOrders: number } | null = null;
  try {
    const [revenue, orders] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalPrice: true }, where: { isPaid: true } }),
      prisma.order.count(),
    ]);
    sales = {
      totalRevenue: Number(revenue._sum.totalPrice ?? 0),
      totalOrders: orders,
    };
  } catch (e) {
    console.error('[supplier-health] DB aggregate failed:', e instanceof Error ? e.message : e);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    suppliers: {
      cjDropshipping: {
        name: 'CJ Dropshipping REST API v2.0',
        configured: cjConfigured,
        status: cjConfigured ? 'UNVERIFIED' : 'NOT_CONFIGURED',
        note: 'Configured only proves an env key is present; live dispatch is unverified until a real order succeeds.',
        endpoint: 'https://developers.cjdropshipping.com/api2.0/v1',
      },
      printify: {
        name: 'Printify Direct POD Hub',
        configured: printifyConfigured,
        shopId: process.env.PRINTIFY_SHOP_ID || null,
        status: printifyConfigured ? 'UNVERIFIED' : 'NOT_CONFIGURED',
      },
      supabase: {
        name: 'Supabase PostgreSQL Storage Hub',
        configured: supabaseConfigured,
        status: supabaseConfigured ? 'UNVERIFIED' : 'NOT_CONFIGURED',
      },
    },
    sales,
  });
}
