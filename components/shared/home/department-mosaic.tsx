import Link from 'next/link';
import { ProductImage } from '@/components/shared/product/product-image';
import { DEPARTMENTS } from '@/lib/constants/departments';

// Editorial browsing groups reuse exact working category routes, not invented subcategories/SKUs.
const groups = [
  { title: 'Style & everyday care', names: ['Custom Apparel', 'Jewelry & Watches', 'Beauty & Personal Care', 'Health & Wellness'] },
  { title: 'Make room for living', names: ['Home & Lifestyle', 'Household Essentials', 'Garden & Patio', 'Arts & Crafts'] },
  { title: 'Play, learn & explore', names: ['Toys & Games', 'Baby & Kids', 'Books & Stationery', 'Sports & Outdoors'] },
  { title: 'Useful finds, different departments', names: ['Tech & Gadgets', 'Automotive & Tools', 'Luggage & Travel', 'Pet Supplies'] },
];
const tile = (name: string) => DEPARTMENTS.find(d => d.name === name)!;
const route = (name: string) => `/search?category=${encodeURIComponent(name)}`;
const highlights = [
  { name: 'Beauty & Personal Care', color: 'bg-[#fce6e8] dark:bg-rose-950/30' },
  { name: 'Home & Lifestyle', color: 'bg-[#e4f0e8] dark:bg-emerald-950/30' },
  { name: 'Tech & Gadgets', color: 'bg-[#e3ecfa] dark:bg-blue-950/30' },
  { name: 'Toys & Games', color: 'bg-[#fff0d4] dark:bg-amber-950/30' },
];

export default function DepartmentMosaic() {
  return (
    <section aria-labelledby='discovery-heading' className='max-w-[1520px] mx-auto px-3 sm:px-4 md:px-6 pt-4 pb-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-2 mb-3'>
        <div>
          <p className='text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-600 dark:text-neutral-400'>Explore Omnistu</p>
          <h1 id='discovery-heading' className='text-2xl md:text-3xl font-bold text-slate-950 dark:text-white'>Find your everyday style</h1>
        </div>
        <Link href='#all-departments-heading' className='text-sm text-indigo-700 dark:text-indigo-300 hover:underline'>All 18 departments</Link>
      </div>
      <div data-testid='department-mosaic' className='grid grid-cols-2 lg:grid-cols-6 gap-3'>
        <Link href={route('Custom Apparel')} className='col-span-2 lg:row-span-2 bg-[#ebd6c2] dark:bg-stone-900 rounded-xl overflow-hidden group'>
          <div className='p-4 md:p-5'>
            <p className='text-xs font-medium text-stone-700 dark:text-stone-300'>Custom Apparel</p>
            <h2 className='text-2xl md:text-3xl font-bold leading-tight text-stone-950 dark:text-white mt-1'>A little more you.</h2>
            <span className='inline-block mt-2 text-sm underline underline-offset-4 text-stone-800 dark:text-stone-200'>Explore the department</span>
          </div>
          <div className='relative aspect-square w-full overflow-hidden'>
            <ProductImage src={tile('Custom Apparel').image} alt='Illustrative T-shirt and hoodie category artwork' sizes='(max-width: 1023px) 94vw, 33vw' priority className='object-cover transition-transform duration-300 group-hover:scale-[1.02]' />
          </div>
        </Link>
        {highlights.map(({name,color}) => (
          <Link key={name} href={route(name)} className={`lg:col-span-2 rounded-xl overflow-hidden p-3 md:p-4 group ${color}`}>
            <h2 className='font-bold text-sm md:text-lg leading-tight text-slate-950 dark:text-white min-h-10 md:min-h-7'>{name}</h2>
            <div className='relative aspect-[4/3] w-full mt-2 rounded-lg overflow-hidden'>
              <ProductImage src={tile(name).image} alt='' sizes='(max-width: 1023px) 45vw, 30vw' className='object-cover group-hover:scale-[1.03] transition-transform duration-300' />
            </div>
          </Link>
        ))}
      </div>
      <p className='text-xs text-neutral-600 dark:text-neutral-400 mt-2'>Illustrative category artwork, not product photography. Open a department to see current items.</p>
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4' data-testid='department-collections'>
        {groups.map(group => (
          <section key={group.title} className='bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4'>
            <h2 className='text-lg font-bold leading-tight min-h-12'>{group.title}</h2>
            <div className='grid grid-cols-2 gap-x-3 gap-y-4 mt-2'>
              {group.names.map(name => (
                <Link key={name} href={route(name)} className='group min-w-0'>
                  <div className='relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800'>
                    <ProductImage src={tile(name).image} alt='' sizes='(max-width: 639px) 42vw, (max-width: 1279px) 20vw, 10vw' className='object-cover group-hover:scale-105 transition-transform duration-300' />
                  </div>
                  <span className='block text-xs font-medium mt-1.5 leading-snug group-hover:underline'>{name}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
