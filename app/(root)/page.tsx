import AmazonHero from '@/components/shared/home/amazon-hero';
import CategoryQuads from '@/components/shared/home/category-quads';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Superstore. Spend less. Smile more.',
  description: 'Omnistu Superstore - Low Prices, Massive Catalog, Fast Dropship Delivery.',
};

export default function Homepage() {
  return (
    <div className='w-full pb-16'>
      {/* 1. Authentic Amazon Wide Hero Banner Carousel */}
      <AmazonHero />

      {/* 2. 26 Authentic Amazon Gateway Category Quads & Department Discovery (100% Category Parity, Zero Product Buy Cards) */}
      <CategoryQuads />
    </div>
  );
}
