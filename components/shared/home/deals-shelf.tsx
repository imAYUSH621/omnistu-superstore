import Link from 'next/link';
import Image from 'next/image';

interface DealItem {
  id: string;
  title: string;
  image: string;
  price: string;
  url: string;
}

const DEALS: DealItem[] = [
  {
    id: 'deal-1',
    title: 'Silicone Magnetic Balls Fidget Toys (4-Pack)',
    image: '/images/products/silicone-magnetic-balls-1.svg',
    price: '$12.99',
    url: '/product/silicone-magnetic-balls-fidget-toys',
  },
  {
    id: 'deal-2',
    title: 'Magnetic Pen Fidget Decompression Toy with Stylus',
    image: '/images/products/magnetic-pen-1.svg',
    price: '$18.95',
    url: '/product/magnetic-pen-fidget-decompression-toy',
  },
  {
    id: 'deal-3',
    title: 'Active Noise-Cancelling Earbuds Pro',
    image: '/images/products/anc-earbuds-1.svg',
    price: '$49.99',
    url: '/product/active-noise-cancelling-wireless-earbuds-pro',
  },
  {
    id: 'deal-4',
    title: 'Smart Gravity Coffee Mug Warmer (3 Temps)',
    image: '/images/products/smart-mug-warmer-1.svg',
    price: '$24.99',
    url: '/product/smart-gravity-induction-coffee-mug-warmer',
  },
  {
    id: 'deal-5',
    title: 'Omnistu Cyber Heavyweight Graphic Hoodie (300DPI)',
    image: '/images/products/placeholder.svg',
    price: '$58.95',
    url: '/product/omnistu-cyber-heavyweight-graphic-hoodie',
  },
  {
    id: 'deal-6',
    title: 'Handcrafted Ultrasonic Aroma Diffuser Flame Light',
    image: '/images/products/flame-diffuser-1.svg',
    price: '$29.99',
    url: '/product/handcrafted-ultrasonic-aroma-diffuser-flame-light',
  },
];

export default function DealsShelf() {
  return (
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 my-6'>
      <div className='bg-white dark:bg-[#1a202c] p-5 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none'>
        {/* Shelf Header */}
        <div className='flex items-baseline justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <h2 className='text-[20px] md:text-[22px] font-bold text-[#0f172a] dark:text-white tracking-tight'>
              Today&apos;s Deals
            </h2>
            <span className='hidden sm:inline-block text-[13px] text-[#565959] dark:text-neutral-400 font-normal'>
              Selected offers from our catalog
            </span>
          </div>
          <Link
            href='/search?sort=deals'
            className='text-[13px] text-[#4f46e5] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-medium'
          >
            See all deals
          </Link>
        </div>

        {/* Horizontal Deals Carousel */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4'>
          {DEALS.map((deal) => (
            <Link
              key={deal.id}
              href={deal.url}
              className='group flex flex-col justify-between p-2 rounded-sm hover:opacity-95 transition'
            >
              <div className='aspect-square relative w-full overflow-hidden bg-[#f7f7f7] dark:bg-neutral-800 p-2 mb-2'>
                <Image
                  src={deal.image}
                  alt={deal.title}
                  fill
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw'
                  className='object-contain p-2 group-hover:scale-105 transition-transform duration-200'
                />
              </div>

              <div>

                {/* Price Display */}
                <div className='flex items-baseline gap-1.5 mb-1'>
                  <span className='text-[16px] font-bold text-[#0f172a] dark:text-white'>
                    {deal.price}
                  </span>
                </div>

                {/* Title */}
                <p className='text-[12px] text-[#0f172a] dark:text-neutral-300 line-clamp-2 leading-tight group-hover:text-[#c7511f]'>
                  {deal.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
