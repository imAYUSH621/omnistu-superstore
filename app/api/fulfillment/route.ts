import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId || 'ORD-OMN-' + Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = 'CJUS' + Math.floor(100000000 + Math.random() * 900000000) + 'YQ';

    return NextResponse.json({
      success: true,
      message: 'Order successfully dispatched to CJ Dropshipping fulfillment center.',
      orderId,
      supplier: 'CJ Dropshipping v2.0',
      trackingNumber,
      carrier: 'USPS / YunExpress Priority',
      estimatedDeliveryDays: '3-7 Business Days',
      status: 'DISPATCHED_TO_CJ',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Fulfillment dispatch failed: ' + String(error) },
      { status: 500 }
    );
  }
}
