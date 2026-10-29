'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@/types';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';

const ProductCarousel = ({ data }: { data: Product[] }) => {
  return (
    <div className='relative w-full overflow-hidden'>
      <Carousel
        className='w-full'
        opts={{
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 7000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent>
          {data.map((product: Product) => (
            <CarouselItem key={product.id}>
              <Link href={`/product/${product.slug}`} className='block relative group'>
                <div className='relative w-full aspect-[16/7] md:aspect-[21/8] max-h-[580px] overflow-hidden bg-neutral-200 dark:bg-neutral-800'>
                  <Image
                    src={product.banner!}
                    alt={product.name}
                    fill
                    priority
                    sizes='100vw'
                    className='object-cover object-top'
                  />
                  {/* Amazon-style bottom gradient fade */}
                  <div className='absolute inset-x-0 bottom-0 h-40 md:h-64 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/60 to-transparent dark:from-[#0f1111] dark:via-[#0f1111]/60 pointer-events-none' />
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className='left-4 top-1/3 -translate-y-1/2 w-11 h-20 rounded-none bg-white/70 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 border border-neutral-300 dark:border-neutral-700 shadow-md text-neutral-800 dark:text-neutral-200' />
        <CarouselNext className='right-4 top-1/3 -translate-y-1/2 w-11 h-20 rounded-none bg-white/70 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80 border border-neutral-300 dark:border-neutral-700 shadow-md text-neutral-800 dark:text-neutral-200' />
      </Carousel>
    </div>
  );
};

export default ProductCarousel;
