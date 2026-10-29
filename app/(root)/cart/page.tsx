import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore Shopping Cart',
  description: 'Review your items and proceed to checkout.',
};

export default function CartPage() {
  return <AmazonPageRenderer pageFile="05_cart_page.html" />;
}
