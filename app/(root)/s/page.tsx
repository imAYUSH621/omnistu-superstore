import AmazonPageRenderer from '@/components/shared/amazon/amazon-page-renderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore: Search Results',
  description: 'Search products on Omnistu Superstore.',
};

export default function SearchResultsPage() {
  return <AmazonPageRenderer pageFile="02_search_magnetic_balls.html" />;
}
