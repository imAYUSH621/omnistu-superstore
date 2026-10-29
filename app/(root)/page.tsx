import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore. Spend less. Smile more.',
  description: 'Omnistu Superstore - Low Prices, Massive Catalog, Fast Dropship Delivery.',
};

export default function Homepage() {
  return <AmazonPageRenderer pageFile="01_homepage.html" />;
}
