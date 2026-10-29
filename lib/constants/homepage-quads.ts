export interface QuadItem {
  title: string;
  label: string;
  image: string;
  url: string;
}

export interface HomepageQuad {
  id: string;
  title: string;
  see_more_url: string;
  see_more_text: string;
  items: QuadItem[];
}

export const HOMEPAGE_QUADS: HomepageQuad[] = [
  {
    id: 'quad-tech',
    title: 'Plug in with Next-Gen Tech',
    see_more_url: '/search?category=Electronics %26 Gadgets',
    see_more_text: 'See all electronics & tech',
    items: [
      {
        title: 'Smart Rings',
        label: 'Smart Rings',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=smart+ring',
      },
      {
        title: 'Hi-Fi Wireless Audio',
        label: 'Wireless Audio',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=earbuds',
      },
      {
        title: 'Neodymium Desk Orbs',
        label: 'Desk Tech',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
        url: '/product/silicone-magnetic-balls-fidget-toys-for-adults-teens',
      },
      {
        title: 'MagSafe RFID Wallets',
        label: 'Everyday Carry',
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=wallet',
      },
    ],
  },
  {
    id: 'quad-apparel',
    title: 'Curate Your Streetwear Aesthetic',
    see_more_url: '/search?category=Apparel %26 Merch',
    see_more_text: 'Explore archival collection',
    items: [
      {
        title: 'Cyberpunk Graphic Tees',
        label: 'Graphic Tees',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
        url: '/search?category=Apparel %26 Merch',
      },
      {
        title: 'Heavyweight Boxy Hoodies',
        label: 'Boxy Hoodies',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=hoodie',
      },
      {
        title: 'Tactile Kinetic Spheres',
        label: 'Pocket EDC',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
        url: '/product/silicone-magnetic-balls-fidget-toys-for-adults-teens',
      },
      {
        title: 'Archival Canvas Caps',
        label: 'Headwear',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=cap',
      },
    ],
  },
  {
    id: 'quad-skincare',
    title: 'Unveil Your Natural Radiance',
    see_more_url: '/search?category=Beauty %26 Personal Care',
    see_more_text: 'Shop botanical skincare',
    items: [
      {
        title: 'Turmeric Kojic Glow Bar',
        label: 'Turmeric Bar',
        image: 'https://images.unsplash.com/photo-1608248597359-543160a0f5df?w=500&auto=format&fit=crop&q=80',
        url: '/product/turmeric-kojic-glow-cleansing-pads-90ct',
      },
      {
        title: 'Hydrating Botanical Serum',
        label: 'Face Serums',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=serum',
      },
      {
        title: 'Cold-Pressed Facial Oils',
        label: 'Facial Oils',
        image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=oil',
      },
      {
        title: 'Natural Sisal Soap Mitts',
        label: 'Bath Essentials',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=bath',
      },
    ],
  },
  {
    id: 'quad-under-25',
    title: 'Top Finds Under $25',
    see_more_url: '/search?price=0-25',
    see_more_text: 'Shop value deals',
    items: [
      {
        title: 'Tactile Sensory Spheres',
        label: 'Sensory Toys',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
        url: '/product/silicone-magnetic-balls-fidget-toys-for-adults-teens',
      },
      {
        title: 'Titanium Bolt EDC Pen',
        label: 'EDC Pens',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=pen',
      },
      {
        title: 'Slim Carbon Fiber Wallet',
        label: 'RFID Wallets',
        image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=wallet',
      },
      {
        title: 'Braided Cable Organizer',
        label: 'Desk Cable Kit',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=cable',
      },
    ],
  },
  {
    id: 'quad-toys',
    title: 'Top Picks in Toys & Games',
    see_more_url: '/search?category=Toys %26 Games',
    see_more_text: 'See Amazon & Omnistu Top 100',
    items: [
      {
        title: '4PCS Silicone Magnetic Balls',
        label: 'Magnetic Balls',
        image: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=500&auto=format&fit=crop&q=80',
        url: '/product/silicone-magnetic-balls-fidget-toys-for-adults-teens',
      },
      {
        title: 'Precision Gyroscope Orb',
        label: 'Gyroscope Orbs',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=gyroscope',
      },
      {
        title: 'Kinetic Moving Sand Art',
        label: 'Desk Art',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=kinetic',
      },
      {
        title: 'Mechanical Infinity Cube',
        label: 'Fidget Cubes',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=fidget',
      },
    ],
  },
  {
    id: 'quad-home',
    title: 'Home & Workspace Harmony',
    see_more_url: '/search?category=Home %26 Kitchen',
    see_more_text: 'Discover workspace upgrades',
    items: [
      {
        title: 'Minimalist Ambient Light',
        label: 'Ambient Lighting',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=lamp',
      },
      {
        title: 'Ultrasonic Aroma Diffuser',
        label: 'Aromatherapy',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=diffuser',
      },
      {
        title: 'Concrete Desk Organizer',
        label: 'Desk Trays',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=organizer',
      },
      {
        title: 'Wireless Charging Pad Mat',
        label: 'Desk Mats',
        image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=charger',
      },
    ],
  },
  {
    id: 'quad-trending',
    title: 'Trending Global Drops',
    see_more_url: '/search?sort=newest',
    see_more_text: 'See all viral arrivals',
    items: [
      {
        title: 'Autonomous AI Streetwear',
        label: 'AI Drops',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=80',
        url: '/search?category=Apparel %26 Merch',
      },
      {
        title: 'Smart Sleep Tracker Ring',
        label: 'Health Wearables',
        image: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=smart+ring',
      },
      {
        title: 'Creator Capsule Essentials',
        label: 'Creator Gear',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80',
        url: '/search?category=Electronics %26 Gadgets',
      },
      {
        title: 'Thermal Insulated Tumblers',
        label: 'Drinkware',
        image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
        url: '/search?q=tumbler',
      },
    ],
  },
  {
    id: 'quad-perks',
    title: 'Omnistu Direct Member Perks',
    see_more_url: '/search',
    see_more_text: 'Learn about our guarantee',
    items: [
      {
        title: 'Omnistu FastPass',
        label: 'FastPass Free 2-Day',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
        url: '/search',
      },
      {
        title: '30-Day Money Back',
        label: 'Risk-Free Returns',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop&q=80',
        url: '/search',
      },
      {
        title: 'Zero Middleman Pricing',
        label: 'Direct Maker Costs',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80',
        url: '/search',
      },
      {
        title: '24/7 Global Tracking',
        label: 'Real-Time Courier',
        image: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80',
        url: '/search',
      },
    ],
  },
];
