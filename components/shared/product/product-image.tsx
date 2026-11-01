import React from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { isImageUnavailable } from '@/lib/constants/unavailable-images';

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

// Honest product image: when the only sample photo on file does not depict
// the product (see lib/constants/unavailable-images.ts), render an explicit
// neutral tile instead of a misleading photo. Product name/link stay real.
export function ProductImage({ src, alt, sizes, className, priority }: Props) {
  if (isImageUnavailable(src)) {
    return (
      <div
        role='img'
        aria-label={`${alt} - image unavailable`}
        className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 select-none'
      >
        <ImageOff className='w-8 h-8' aria-hidden />
        <span className='text-[11px] font-medium uppercase tracking-wide'>Image unavailable</span>
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />;
}
