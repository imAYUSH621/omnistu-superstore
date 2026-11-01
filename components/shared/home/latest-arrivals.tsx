import Link from 'next/link';
import { getLatestProducts } from '@/lib/actions/product.actions';
import ProductCard from '@/components/shared/product/product-card';
import T from '@/components/shared/i18n-text';

export default async function LatestArrivals() {
  const products = await getLatestProducts();
  if (!products || products.length === 0) return null;

  return (
    <div className='bg-white dark:bg-[#1a202c] shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 p-5'>
      <div className='flex items-center justify-between mb-4 border-b border-[#e7e7e7] dark:border-neutral-800 pb-2'>
        <h2 className='text-[18px] md:text-[20px] font-bold text-[#0f172a] dark:text-white tracking-tight'>
          <T k='newArrivals' />
        </h2>
        <Link
          href='/search'
          className='text-[13px] text-[#4f46e5] dark:text-[#56b6c2] hover:underline font-medium'
        >
          <T k='shopAll' />
        </Link>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
