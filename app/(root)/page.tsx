import TopCategoryCards from '@/components/shared/home/top-category-cards';
import CategoryQuads from '@/components/shared/home/category-quads';
import DepartmentRibbon from '@/components/shared/home/department-ribbon';
import LatestArrivals from '@/components/shared/home/latest-arrivals';
import PersonalHero from '@/components/shared/home/personal-hero';
import TrustRibbon from '@/components/shared/home/trust-ribbon';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omnistu Super Store - Gourmet, tech, apparel and more',
  description:
    'Omnistu Superstore demo storefront - category-first shopping across gourmet food, tech gadgets, jewelry, watches, apparel and more.',
};

export default function Homepage() {
  return (
    <div className='w-full min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] pb-16 font-sans'>
      <div className='max-w-[1520px] mx-auto space-y-4 px-3 sm:px-4 md:px-6 pt-3'>
        {/* 1. Signed-in personalization / honest sign-in CTA */}
        <PersonalHero />

        {/* 2. Category-first: real departments with real counts */}
        <DepartmentRibbon />
      </div>

      {/* 3. Top category cards with paddles (real categories, verified imagery) */}
      <TopCategoryCards />

      <div className='max-w-[1520px] mx-auto space-y-4 px-3 sm:px-4 md:px-6 pt-2'>
        {/* 4. Real latest products from the catalog */}
        <LatestArrivals />

        {/* 5. Honest trust ribbon */}
        <TrustRibbon />
      </div>

      {/* 6. Category quads (real seeded products, verified imagery) */}
      <CategoryQuads />
    </div>
  );
}
