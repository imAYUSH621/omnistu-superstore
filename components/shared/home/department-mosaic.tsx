import Link from 'next/link';
import HomeText from './home-text';
import type{HomeKey}from '@/lib/home-language';
import { ProductImage } from '@/components/shared/product/product-image';
import { DEPARTMENTS } from '@/lib/constants/departments';

// Editorial browsing groups reuse exact working category routes, not invented subcategories/SKUs.
const groups: {title:HomeKey;names:string[]}[] = [
  { title: 'styleGroup', names: ['Custom Apparel', 'Jewelry & Watches', 'Beauty & Personal Care', 'Health & Wellness'] },
  { title: 'homeGroup', names: ['Home & Lifestyle', 'Household Essentials', 'Garden & Patio', 'Arts & Crafts'] },
  { title: 'funGroup', names: ['Toys & Games', 'Baby & Kids', 'Books & Stationery', 'Sports & Outdoors'] },
  { title: 'usefulGroup', names: ['Tech & Gadgets', 'Automotive & Tools', 'Luggage & Travel', 'Pet Supplies'] },
];
const tile = (name: string) => DEPARTMENTS.find(d => d.name === name)!;
const route = (name: string) => `/search?category=${encodeURIComponent(name)}`;
const highlights: {name:string;title:HomeKey;label:HomeKey;color:string}[] = [
  { name: 'Beauty & Personal Care', title: 'beautyTitle', label: 'beauty', color: 'bg-[#fce6e8] dark:bg-rose-950/30' },
  { name: 'Home & Lifestyle', title: 'homeTitle', label: 'home', color: 'bg-[#e4f0e8] dark:bg-emerald-950/30' },
  { name: 'Tech & Gadgets', title: 'techTitle', label: 'tech', color: 'bg-[#e3ecfa] dark:bg-blue-950/30' },
  { name: 'Toys & Games', title: 'toysTitle', label: 'toys', color: 'bg-[#fff0d4] dark:bg-amber-950/30' },
];

export default function DepartmentMosaic() {
  return (
    <section aria-labelledby='discovery-heading' className='max-w-[1520px] mx-auto px-3 sm:px-4 md:px-6 pt-4 pb-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-2 mb-3'>
        <div>
          <p className='text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-600 dark:text-neutral-400'><HomeText name='inspiration'/></p>
          <h1 id='discovery-heading' className='text-2xl md:text-3xl font-bold text-slate-950 dark:text-white'><HomeText name='discover'/></h1>
        </div>
        <Link href='#all-departments-heading' className='text-sm text-indigo-700 dark:text-indigo-300 hover:underline'><HomeText name='browseCategories'/></Link>
      </div>
      <div data-testid='department-mosaic' className='grid grid-cols-2 lg:grid-cols-6 gap-3'>
        <Link href={route('Custom Apparel')} className='col-span-2 lg:row-span-2 bg-[#e8dfd4] dark:bg-stone-900 rounded-xl overflow-hidden group flex lg:flex-col min-h-[200px]'>
          <div className='p-4 md:p-5 w-[48%] lg:w-full shrink-0 self-center lg:self-auto'>
            <p className='text-xs font-medium text-stone-700 dark:text-stone-300'><HomeText name='style'/></p>
            <h2 className='text-xl md:text-3xl font-bold leading-tight text-stone-950 dark:text-white mt-1'><HomeText name='wear'/></h2>
            <span className='inline-block mt-2 text-sm underline underline-offset-4 text-stone-800 dark:text-stone-200'><HomeText name='clothing'/></span>
          </div>
          <div className='relative w-[52%] lg:w-full min-h-[200px] lg:min-h-0 lg:aspect-square lg:flex-1 overflow-hidden'>
            <ProductImage src={tile('Custom Apparel').image} alt='Illustrative hoodie on a hanger and folded clothing, with no model' sizes='(max-width: 1023px) 48vw, 33vw' priority className='object-cover transition-transform duration-300 group-hover:scale-[1.02]' />
          </div>
        </Link>
        {highlights.map(({name,title,label,color}) => (
          <Link key={name} href={route(name)} className={`lg:col-span-2 rounded-xl overflow-hidden p-3 md:p-4 group flex flex-col ${color}`}>
            <h2 className='font-bold text-sm md:text-lg leading-tight text-slate-950 dark:text-white min-h-10 md:min-h-7'><HomeText name={title}/></h2>
            <div className='relative aspect-[5/3] w-full mt-2 rounded-lg overflow-hidden'>
              <ProductImage src={tile(name).image} alt='' sizes='(max-width: 1023px) 45vw, 30vw' className='object-cover group-hover:scale-[1.03] transition-transform duration-300' />
            </div>
            <span className='text-xs md:text-sm mt-2 underline underline-offset-2'><HomeText name={label}/></span>
          </Link>
        ))}
      </div>
      <p className='text-xs text-neutral-600 dark:text-neutral-400 mt-2'><HomeText name='illustration'/></p>
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4' data-testid='department-collections'>
        {groups.map(group => (
          <section key={group.title} className='bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4'>
            <h2 className='text-lg font-bold leading-tight min-h-12'><HomeText name={group.title}/></h2>
            <div className='grid grid-cols-2 gap-x-3 gap-y-4 mt-2'>
              {group.names.map(name => (
                <Link key={name} href={route(name)} className='group min-w-0'>
                  <div className='relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800'>
                    <ProductImage src={tile(name).image} alt='' sizes='(max-width: 639px) 42vw, (max-width: 1279px) 20vw, 10vw' className='object-cover group-hover:scale-105 transition-transform duration-300' />
                  </div>
                  <span className='block text-xs font-medium mt-1.5 leading-snug group-hover:underline'><HomeText department={name}/></span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
