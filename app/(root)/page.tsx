import TopCategoryCards from '@/components/shared/home/top-category-cards';
import CategoryQuads from '@/components/shared/home/category-quads';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon.com. Spend less. Smile more.',
  description: 'Omnistu Superstore - Authentic Amazon category gateway, high-volume dropship fulfillment, and direct manufacturer pricing.',
};

export default function Homepage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] pb-16 font-["Amazon_Ember",Arial,sans-serif]'>
      {/* 1. Authentic Top Row: 6 Single-Creative Category Cards with Navigation Paddles */}
      <TopCategoryCards />

      {/* 2. Authentic Continuous Category Quads (26 Multi-Category Quads with Chevron Headers) */}
      <CategoryQuads />
    </div>
  );
}
