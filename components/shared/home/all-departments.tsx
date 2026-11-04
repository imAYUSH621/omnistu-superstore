import Link from 'next/link';
import { getAllCategories } from '@/lib/actions/product.actions';
import { DEPARTMENTS } from '@/lib/constants/departments';
import { ProductImage } from '@/components/shared/product/product-image';

// Every department with its own art. Counts come from the catalog;
// a department with no products says so instead of implying stock.
export default async function AllDepartments() {
  const cats = await getAllCategories();
  const counts = new Map<string, number>();
  for (const c of cats) {
    const n = typeof c._count === 'number' ? c._count : (c._count as { category?: number })?.category ?? 0;
    counts.set(c.category, n);
  }

  return (
    <section
      aria-labelledby='all-departments-heading'
      className='bg-white dark:bg-[#1a202c] border border-[#d5d9d9]/70 dark:border-neutral-800 p-4 md:p-5'
    >
      <div className='flex flex-wrap items-baseline justify-between gap-2 mb-3'>
        <h2 id='all-departments-heading' className='text-[18px] md:text-[20px] font-bold text-[#0f172a] dark:text-white tracking-tight'>
          More ways to browse
        </h2>
        <Link href='/search' className='text-[13px] text-[#4f46e5] dark:text-[#56b6c2] hover:underline font-medium'>
          Browse all products
        </Link>
      </div>
      <ul data-testid='all-departments' className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'>
        {DEPARTMENTS.map((d) => {
          const n = counts.get(d.name) ?? 0;
          return (
            <li key={d.name}>
              <Link
                href={`/search?category=${encodeURIComponent(d.name)}`}
                className='group block border border-neutral-200/80 dark:border-neutral-800 hover:border-[#4f46e5] transition-colors'
              >
                <div className='relative w-full aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800'>
                  <ProductImage
                    src={d.image}
                    alt={d.name}
                    sizes='(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw'
                    className='object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                </div>
                <div className='p-2'>
                  <div className='text-[13px] font-semibold leading-tight text-[#0f172a] dark:text-white'>{d.name}</div>
                  <div className='text-[11px] text-[#565959] dark:text-neutral-400' data-testid='dept-count'>
                    {n > 0 ? `${n} ${n === 1 ? 'item' : 'items'}` : 'No items yet'}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
