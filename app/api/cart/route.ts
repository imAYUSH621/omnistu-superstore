import {NextResponse} from 'next/server';

// This historical cookie cart was never the Store's persisted cart. Refuse
// fake success and caller-supplied prices instead of creating a second cart.
function retiredCart() {
  return NextResponse.json({
    success: false,
    error: 'LEGACY_CART_RETIRED',
    message: 'This cart API is retired. Use the product page to choose an option and /cart to review the Store cart.',
    cartUrl: '/cart',
  }, {status: 410, headers: {'Cache-Control': 'no-store'}});
}

export async function GET() {return retiredCart();}
export async function POST() {return retiredCart();}
export async function DELETE() {
  const response = retiredCart();
  // Only remove the obsolete cookie. Never clear the actual Store cart or
// claim its items were removed.
  response.cookies.set('omnistu_cart', '', {path: '/', maxAge: 0, sameSite: 'lax', httpOnly: true});
  return response;
}
