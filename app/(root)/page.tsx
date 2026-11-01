import TopCategoryCards from '@/components/shared/home/top-category-cards';
import CategoryQuads from '@/components/shared/home/category-quads';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Super Store - Everyday essentials, gourmet and more',
  description: 'Omnistu Superstore - Authentic Amazon category gateway, high-volume dropship fulfillment, and direct manufacturer pricing.',
};

export default function Homepage() {
  return (
    <div className='w-full min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] pb-16 font-sans'>
      {/* 1. Authentic Top Row: 6 Single-Creative Category Cards with Navigation Paddles */}
      <TopCategoryCards />

      {/* 2. Authentic Continuous Category Quads (26 Multi-Category Quads with Chevron Headers) */}
      <CategoryQuads />
    </div>
  );
}
