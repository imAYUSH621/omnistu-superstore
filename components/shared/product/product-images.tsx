'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
import { isImageUnavailable } from '@/lib/constants/unavailable-images';

const ProductImages = ({ images, placeholder = false }: { images: string[]; placeholder?: boolean }) => {
  const [current, setCurrent] = useState(0);
  // Drop sample photos that do not depict this product (tracker D21); if
  // none remain, show one explicit neutral tile instead of a wrong photo.
  const usable = images.filter((i) => !isImageUnavailable(i));

  if (usable.length === 0) {
    return (
      <div
        role='img'
        aria-label='product image unavailable'
        className='min-h-[300px] aspect-square w-full flex flex-col items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 select-none'
      >
        <ImageOff className='w-10 h-10' aria-hidden />
        <span className='text-[12px] font-medium uppercase tracking-wide'>Image unavailable</span>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Image
          src={usable[Math.min(current, usable.length - 1)]}
          alt={placeholder ? 'placeholder image, not a photo of this product' : 'product image'}
          width={1000}
          height={1000}
          className='min-h-[300px] object-cover object-center'
        />
        {placeholder && (
          <span className='absolute left-2 top-2 rounded bg-red-700 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white' data-testid='placeholder-image-label'>
            Placeholder image - not a photo of this product
          </span>
        )}
      </div>
      <div className='flex'>
        {usable.map((image, index) => (
          <div
            key={image}
            onClick={() => setCurrent(index)}
            className={cn(
              'border mr-2 cursor-pointer hover:border-orange-600',
              current === index && 'border-orange-500'
            )}
          >
            <Image src={image} alt='image' width={100} height={100} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
