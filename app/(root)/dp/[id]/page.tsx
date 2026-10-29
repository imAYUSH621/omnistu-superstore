import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Silicone Magnetic Balls Fidget Toys | Omnistu Superstore',
  description: 'Stress relief sensory toy for adults and teens. Fast delivery.',
};

export default function ProductDetailPage() {
  return <AmazonPageRenderer pageFile="04_product_detail_page.html" />;
}
