import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore Checkout',
  description: 'Secure checkout and order placement.',
};

export default function CheckoutPage() {
  return <AmazonPageRenderer pageFile="06_checkout_page.html" />;
}
