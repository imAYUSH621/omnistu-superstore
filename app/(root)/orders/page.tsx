import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Orders | Omnistu Superstore',
  description: 'Track, return, or buy items again.',
};

export default function OrdersPage() {
  return <AmazonPageRenderer pageFile="07_orders_page.html" />;
}
