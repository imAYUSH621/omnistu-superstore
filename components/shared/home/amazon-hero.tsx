'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'hero-1',
    image: '/assets/images/259f3bea-18e6-4716-b5d2-cd59d68d2f20.__CR0,0,2440,1000_PT0_SX1464_V1___.jpg',
    title: 'Deals on Toys & Sensory Gadgets',
    url: '/search?category=Toys %26 Games',
  },
  {
    id: 'hero-2',
    image: '/assets/images/eb5e2247-3a75-469c-a20a-ee6ae67677f3.__CR0,0,2928,1250_PT0_SX1464_V1___.jpg',
    title: 'Next-Gen Wireless Tech & Smart Devices',
    url: '/search?category=Electronics %26 Gadgets',
  },
  {
    id: 'hero-3',
    image: '/assets/images/b1b5ae43-70ad-4242-bc93-2f77fa70e2f9.__CR0,0,2440,1000_PT0_SX1464_V1___.jpg',
    title: 'Curated Streetwear & Organic Cotton Drops',
    url: '/search?category=Apparel %26 Merch',
  },
  {
    id: 'hero-4',
    image: '/assets/images/d96295b8-cf95-4931-ac68-3d58beb29658.__CR0,0,1464,600_PT0_SX1464_V1___.jpg',
    title: 'Workspace Comfort & Smart Home Essentials',
    url: '/search?category=Home %26 Kitchen',
  },
];

export default function AmazonHero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div className='relative w-full max-w-[1520px] mx-auto overflow-hidden'>
      {/* Slides Container */}
      <div className='relative aspect-[2440/1000] sm:aspect-[2440/900] md:aspect-[2440/800] lg:aspect-[2440/750] w-full'>
        {HERO_SLIDES.map((slide, idx) => (
          <Link
            key={slide.id}
            href={slide.url}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={idx === 0}
              className='object-cover object-top'
            />
          </Link>
        ))}

        {/* Amazon Bottom Gradient Mask into #eaeded */}
        <div className='absolute inset-x-0 bottom-0 h-40 md:h-56 lg:h-72 bg-gradient-to-t from-[#eaeded] via-[#eaeded]/80 to-transparent z-20 pointer-events-none' />

        {/* Carousel Left / Right Paddles */}
        <button
          onClick={(e) => {
            e.preventDefault();
            prevSlide();
          }}
          className='absolute left-2 top-[35%] -translate-y-1/2 z-30 p-2 md:p-3 bg-white/40 hover:bg-white/80 active:bg-white rounded border border-neutral-400/50 shadow transition focus:outline-none focus:ring-2 focus:ring-[#007185]'
          aria-label='Previous Slide'
        >
          <ChevronLeft className='w-6 h-6 md:w-8 md:h-8 text-neutral-800' />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            nextSlide();
          }}
          className='absolute right-2 top-[35%] -translate-y-1/2 z-30 p-2 md:p-3 bg-white/40 hover:bg-white/80 active:bg-white rounded border border-neutral-400/50 shadow transition focus:outline-none focus:ring-2 focus:ring-[#007185]'
          aria-label='Next Slide'
        >
          <ChevronRight className='w-6 h-6 md:w-8 md:h-8 text-neutral-800' />
        </button>
      </div>
    </div>
  );
}
