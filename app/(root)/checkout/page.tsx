import { redirect } from 'next/navigation';

// Redirect stub. force-dynamic: without the removed root loading.tsx shell,
// an unconditional redirect() during build prerender fails the build; at
// request time it correctly returns a real 307.
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  redirect('/place-order');
}
