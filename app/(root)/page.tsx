import AllDepartments from '@/components/shared/home/all-departments';
import DepartmentMosaic from '@/components/shared/home/department-mosaic';
import CategoryQuads from '@/components/shared/home/category-quads';
import LatestArrivals from '@/components/shared/home/latest-arrivals';
import PersonalHero from '@/components/shared/home/personal-hero';
import TrustRibbon from '@/components/shared/home/trust-ribbon';
import{homeMetadata}from '@/lib/home-metadata';
export const generateMetadata=homeMetadata;

export default function Homepage() {
  return (
    <div className='w-full min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] pb-16 font-sans'>
      {/* Apparel-first discovery, before account prompts. */}
      <DepartmentMosaic />

      <div className='max-w-[1520px] mx-auto space-y-4 px-3 sm:px-4 md:px-6 pt-2'>
        <PersonalHero />
        {/* 3. Every department with its own art; empty ones say so */}
        <AllDepartments />

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
