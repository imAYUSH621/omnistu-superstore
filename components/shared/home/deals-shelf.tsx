import Link from 'next/link';
import Image from 'next/image';

interface DealItem {
  id: string;
  title: string;
  image: string;
  discount: string;
  price: string;
  listPrice: string;
  url: string;
}

const DEALS: DealItem[] = [
  {
    id: 'deal-1',
    title: 'Silicone Magnetic Balls Fidget Toys (4-Pack)',
    image: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=500&auto=format&fit=crop&q=80',
    discount: '43% off',
    price: '$19.99',
    listPrice: '$34.99',
    url: '/product/silicone-magnetic-balls-fidget-toys-for-adults-teens',
  },
  {
    id: 'deal-2',
    title: 'Turmeric Kojic Glow Pads (90 Count)',
    image: 'https://images.unsplash.com/photo-1608248597359-543160a0f5df?w=500&auto=format&fit=crop&q=80',
    discount: '38% off',
    price: '$24.95',
    listPrice: '$39.99',
    url: '/product/turmeric-kojic-glow-cleansing-pads-90ct',
  },
  {
    id: 'deal-3',
    title: 'Smart Health & Sleep Tracker Ring',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=80',
    discount: '35% off',
    price: '$89.00',
    listPrice: '$139.00',
    url: '/search?q=smart+ring',
  },
  {
    id: 'deal-4',
    title: 'Hi-Fi Noise Cancelling Wireless Earbuds',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
    discount: '50% off',
    price: '$39.99',
    listPrice: '$79.99',
    url: '/search?q=earbuds',
  },
  {
    id: 'deal-5',
    title: 'Cyberpunk Heavyweight Streetwear Hoodie',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
    discount: '25% off',
    price: '$48.00',
    listPrice: '$64.00',
    url: '/search?category=Apparel %26 Merch',
  },
  {
    id: 'deal-6',
    title: 'Ultrasonic Wood Grain Aromatherapy Diffuser',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80',
    discount: '40% off',
    price: '$22.50',
    listPrice: '$37.50',
    url: '/search?category=Home %26 Kitchen',
  },
];

export default function DealsShelf() {
  return (
    <section className='bg-white dark:bg-[#1a202c] p-5 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 max-w-[1520px] mx-auto'>
      <div className='flex items-baseline justify-between mb-4'>
        <div className='flex items-baseline gap-3'>
          <h2 className='text-[20px] md:text-[22px] font-bold text-[#0f1111] dark:text-white'>
            Today&apos;s Deals
          </h2>
          <Link
            href='/search?sort=deals'
            className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-medium'
          >
            See all deals
          </Link>
        </div>
      </div>

      {/* Horizontal Scrolling Deals Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-x-auto pb-2'>
        {DEALS.map((deal) => (
          <Link
            key={deal.id}
            href={deal.url}
            className='group flex flex-col justify-between p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition'
          >
            <div>
              <div className='aspect-square relative w-full overflow-hidden bg-[#f7f7f7] dark:bg-neutral-800 rounded mb-2'>
                <Image
                  src={deal.image}
                  alt={deal.title}
                  fill
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw'
                  className='object-cover group-hover:scale-105 transition-transform duration-200'
                />
              </div>

              <div className='flex items-center gap-1.5 mb-1'>
                <span className='bg-[#cc0c39] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm'>
                  {deal.discount}
                </span>
                <span className='text-[#cc0c39] text-[11px] font-bold'>
                  Limited time deal
                </span>
              </div>

              <div className='flex items-baseline gap-1.5 mb-1'>
                <span className='text-[16px] font-bold text-[#0f1111] dark:text-white'>
                  {deal.price}
                </span>
                <span className='text-[11px] text-muted-foreground line-through'>
                  {deal.listPrice}
                </span>
              </div>
            </div>

            <p className='text-[12px] text-[#0f1111] dark:text-neutral-300 line-clamp-2 leading-tight group-hover:text-[#c7511f] dark:group-hover:text-amber-400'>
              {deal.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
