import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Flame, Sparkles, TrendingUp, Zap } from 'lucide-react';

export default function CategoryQuads() {
  const quads = [
    {
      title: 'Top Sensory & Desk Toys',
      tag: 'Viral #1 Bestsellers',
      icon: Flame,
      image: '/images/products/silicone-magnetic-balls-1.svg',
      link: '/search?category=Toys %26 Games',
      cta: 'Explore Sensory Toys',
      highlight: 'Up to 45% Off',
    },
    {
      title: 'Apparel & Streetwear Drops',
      tag: 'Printify 300DPI Lab',
      icon: Sparkles,
      image: '/images/sample-products/p1-1.jpg',
      link: '/search?category=Apparel %26 Merch',
      cta: 'Shop Heavyweight Hoodies',
      highlight: 'Organic 400GSM Cotton',
    },
    {
      title: 'Next-Gen Audio & Gadgets',
      tag: 'Smart Tech Gear',
      icon: Zap,
      image: '/images/products/anc-earbuds-1.svg',
      link: '/search?category=Electronics %26 Gadgets',
      cta: 'Discover ANC Earbuds',
      highlight: 'Express Next-Day Dispatch',
    },
    {
      title: 'Smart Home & Desk Comfort',
      tag: 'Productivity Essentials',
      icon: TrendingUp,
      image: '/images/products/smart-mug-warmer-1.svg',
      link: '/search?category=Home %26 Kitchen',
      cta: 'View Mug Warmers & Diffusers',
      highlight: 'Customer Favorites',
    },
  ];

  return (
    <section className='my-8'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {quads.map((q, idx) => {
          const Icon = q.icon;
          return (
            <Card
              key={idx}
              className='overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-xl bg-card hover:shadow-md transition flex flex-col justify-between'
            >
              <CardContent className='p-5 space-y-3 flex-1 flex flex-col justify-between'>
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400'>
                    <span className='flex items-center gap-1'>
                      <Icon className='w-3.5 h-3.5' /> {q.tag}
                    </span>
                    <span className='text-xs text-muted-foreground font-normal'>
                      {q.highlight}
                    </span>
                  </div>
                  <h3 className='font-bold text-base text-foreground leading-snug'>
                    {q.title}
                  </h3>
                </div>

                {/* Quad Visual */}
                <Link
                  href={q.link}
                  className='relative w-full h-44 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 block group'
                >
                  <Image
                    src={q.image}
                    alt={q.title}
                    fill
                    sizes='(max-width: 768px) 100vw, 25vw'
                    className='object-contain p-3 group-hover:scale-105 transition-transform duration-300'
                  />
                </Link>

                {/* Link Action */}
                <Link
                  href={q.link}
                  className='text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1'
                >
                  <span>{q.cta}</span>
                  <ArrowRight className='w-3 h-3' />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
