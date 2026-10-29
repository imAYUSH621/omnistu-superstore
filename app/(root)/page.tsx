import AmazonHero from '@/components/shared/home/amazon-hero';
import CategoryQuads from '@/components/shared/home/category-quads';
import DealsShelf from '@/components/shared/home/deals-shelf';
import BestSellersShelf from '@/components/shared/home/best-sellers-shelf';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore. Spend less. Smile more.',
  description: 'Omnistu Superstore - Low Prices, Massive Catalog, Fast Dropship Delivery.',
};

export default function Homepage() {
  return (
    <div className='w-full pb-12'>
      {/* 1. Authentic Amazon Hero Banner Carousel */}
      <AmazonHero />

      {/* 2. 8 Authoritative Gateway Quads Overlapping Hero */}
      <CategoryQuads />

      {/* 3. Amazon "Today's Deals" Shelf */}
      <DealsShelf />

      {/* 4. Amazon Top 100 Best Sellers with Dynamic Category Switcher */}
      <BestSellersShelf />
    </div>
  );
}
