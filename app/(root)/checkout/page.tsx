import { redirect } from 'next/navigation';

// The scraped Amazon checkout page was removed (D2 trade-dress cleanup).
// The real checkout flow lives at /place-order.
export default function CheckoutPage() {
  redirect('/place-order');
}
