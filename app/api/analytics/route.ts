import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        totalRevenue: 24892.40,
        netMargin: 17026.40,
        netMarginPct: 68.4,
        ordersCaptured: 1248,
        activeCartAbandonments: 14,
        conversionRate: 12.4,
      },
      topKeywords: [
        { query: 'magnetic balls', count: 432, trend: '+24%' },
        { query: 'turmeric soap', count: 389, trend: '+18%' },
        { query: 'smart ring', count: 295, trend: '+32%' },
        { query: 'boxy hoodie', count: 218, trend: '+15%' },
        { query: 'fidget sensory', count: 174, trend: '+9%' },
      ],
      mostViewedProducts: [
        { name: 'Silicone Magnetic Balls (4-Pack)', views: 1840, cartAdds: 412 },
        { name: 'Turmeric Kojic Glow Cleansing Pads', views: 1420, cartAdds: 340 },
        { name: 'Smart Health & Sleep Tracker Ring', views: 980, cartAdds: 180 },
        { name: 'Cyberpunk Heavyweight Streetwear Hoodie', views: 820, cartAdds: 145 },
      ],
    },
  });
}
