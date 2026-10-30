'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'hero-1',
    image: '/assets/images/asset_4f92ec0be5ff.jpg',
    title: 'Plug in with Next-Gen Tech & Electronics',
    url: '/s?k=electronics',
  },
  {
    id: 'hero-2',
    image: '/assets/images/asset_8aa8fad952f0.jpg',
    title: 'Discover Must-Haves for Home & Kitchen',
    url: '/s?k=home%20and%20kitchen',
  },
  {
    id: 'hero-3',
    image: '/assets/images/asset_af098858a87f.jpg',
    title: 'Explore Trending Streetwear & Fashion Finds',
    url: '/s?k=clothing',
  },
  {
    id: 'hero-4',
    image: '/assets/images/asset_cee3b5eaf85b.jpg',
    title: 'Fun Finds for Family, Games & Sensory Play',
    url: '/s?k=toys',
  },
  {
    id: 'hero-5',
    image: '/assets/images/asset_d18493beaa68.jpg',
    title: 'Level Up Your Daily Self-Care & Radiance',
    url: '/s?k=beauty',
  },
  {
    id: 'hero-6',
    image: '/assets/images/asset_fb60f94f7085.jpg',
    title: 'Books You Can’t Put Down & Desk Essentials',
    url: '/s?k=books',
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
