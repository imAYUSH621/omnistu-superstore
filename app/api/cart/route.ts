import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const rawCart = cookieStore.get('omnistu_cart')?.value;
  try {
    const items = rawCart ? JSON.parse(rawCart) : [];
    return NextResponse.json({ success: true, count: items.length, items });
  } catch {
    return NextResponse.json({ success: true, count: 0, items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    const rawCart = cookieStore.get('omnistu_cart')?.value;
    let items = [];
    try {
      items = rawCart ? JSON.parse(rawCart) : [];
    } catch {
      items = [];
    }

    const existingIndex = items.findIndex((i: { asin?: string; id?: string }) => 
      (body.asin && i.asin === body.asin) || (body.id && i.id === body.id)
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity = (items[existingIndex].quantity || 1) + (body.quantity || 1);
    } else {
      items.push({
        asin: body.asin || 'OMN-' + Date.now(),
        title: body.title || 'Product',
        price: body.price || '$19.99',
        image: body.image || '/assets/images/nav-sprite-global-1x-reorg-privacy._CB779528203_.png',
        quantity: body.quantity || 1,
      });
    }

    const response = NextResponse.json({ success: true, count: items.length, items });
    response.cookies.set('omnistu_cart', JSON.stringify(items), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, count: 0, items: [] });
  response.cookies.set('omnistu_cart', JSON.stringify([]), {
    path: '/',
    maxAge: 0,
  });
  return response;
}
