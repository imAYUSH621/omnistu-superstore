import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore Best Sellers: Toys & Games',
  description: 'Our most popular products based on sales. Updated hourly.',
};

export default function BestSellersCategoryPage() {
  return <AmazonPageRenderer pageFile="03_category_toys_bestsellers.html" />;
}
