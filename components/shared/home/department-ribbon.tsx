import Link from 'next/link';
import {
  Laptop, Shirt, Home, Gamepad2, Sparkles, Watch, Utensils, LayoutGrid, Tag,
} from 'lucide-react';
import { getAllCategories } from '@/lib/actions/product.actions';
import T from '@/components/shared/i18n-text';

// Icon per known real category; unknown categories fall back to Tag.
const ICONS: Record<string, typeof Laptop> = {
  'Electronics & Gadgets': Laptop,
  'Tech & Gadgets': Laptop,
  'Custom Apparel': Shirt,
  'Apparel & Merch': Shirt,
  "Men's Dress Shirts": Shirt,
  'Home & Kitchen': Home,
  'Home & Lifestyle': Home,
  'Toys & Games': Gamepad2,
  'Jewelry & Watches': Watch,
  'Gourmet & Indian Food': Utensils,
};

export default async function DepartmentRibbon() {
  const categories = await getAllCategories();

  return (
    <div className='bg-white dark:bg-[#1a202c] shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 p-5'>
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4 border-b border-[#e7e7e7] dark:border-neutral-800 pb-2'>
        <h2 className='text-[18px] md:text-[20px] font-bold text-[#0f172a] dark:text-white tracking-tight'>
          <T k='shopByDepartment' />
        </h2>
        <Link
          href='/search'
          className='text-[13px] text-[#4f46e5] dark:text-[#56b6c2] hover:underline font-medium'
        >
          <T k='viewAllCategories' />
        </Link>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
        {categories.map((c) => {
          const IconComponent = ICONS[c.category] ?? Tag;
          const count = typeof c._count === 'number' ? c._count : (c._count as { category?: number })?.category ?? 0;
          return (
            <Link
              key={c.category}
              href={`/search?category=${encodeURIComponent(c.category)}`}
              className='group flex items-center gap-3 p-3 rounded border border-neutral-200/80 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-neutral-800/40 hover:bg-[#f0f2f2] dark:hover:bg-neutral-800 hover:border-[#4f46e5] transition-all cursor-pointer'
            >
              <div className='p-2.5 rounded-full bg-white dark:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-600 group-hover:scale-110 transition-transform'>
                <IconComponent className='w-5 h-5 text-[#4f46e5] dark:text-[#56b6c2]' />
              </div>
              <div className='flex flex-col min-w-0'>
                <span className='text-[12px] leading-tight font-semibold text-[#0f172a] dark:text-white line-clamp-2'>
                  {c.category}
                </span>
                <span className='text-[11px] text-[#565959] dark:text-neutral-400'>
                  {count} {count === 1 ? <T k='itemSingular' /> : <T k='itemPlural' />}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
