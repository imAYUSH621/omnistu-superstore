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
        title: 'Smart Health & Sleep Tracker Rings',
        label: 'Smart Rings',
        image: '/images/sample-products/smart-titanium-health-fitness-tracking-ring-continuous-heart-rate-slee-1.jpg',
        url: '/search?category=Electronics %26 Gadgets',
      },
      {
        title: 'Active Noise-Cancelling Earbuds Pro',
        label: 'Hi-Fi Audio',
        image: '/images/products/anc-earbuds-1.svg',
        url: '/product/active-noise-cancelling-wireless-earbuds-pro',
      },
      {
        title: 'MagSafe Fast Wireless Magnetic Power Bank',
        label: 'Everyday Power',
        image: '/images/products/magsafe-powerbank-1.svg',
        url: '/product/magsafe-fast-wireless-magnetic-power-bank',
      },
      {
        title: 'Neodymium Magnetic Desk Orbs',
        label: 'Desk Tech',
        image: '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg',
        url: '/product/silicone-magnetic-balls-fidget-toys',
      },
    ],
  },
  {
    id: 'quad-apparel',
    title: 'Curate Your Streetwear Aesthetic',
    see_more_url: '/search?category=Apparel %26 Merch',
    see_more_text: 'Explore archival streetwear',
    items: [
      {
        title: 'Cyberpunk Graphic Heavyweight Hoodie',
        label: 'Printify 300DPI',
        image: '/images/sample-products/p1-1.jpg',
        url: '/product/omnistu-cyber-heavyweight-graphic-hoodie',
      },
      {
        title: 'Vintage Wash Oversized Streetwear Tee',
        label: 'Boxy Tees',
        image: '/images/sample-products/p2-1.jpg',
        url: '/product/omnistu-vintage-wash-streetwear-oversized-tee',
      },
      {
        title: 'Tactile Kinetic Fidget Spheres',
        label: 'Pocket EDC',
        image: '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg',
        url: '/product/silicone-magnetic-balls-fidget-toys',
      },
      {
        title: 'Polo Sporting Athletic Shirts',
        label: 'Apparel Essentials',
        image: '/images/sample-products/p3-1.jpg',
        url: '/search?category=Apparel %26 Merch',
      },
    ],
  },
  {
    id: 'quad-sensory',
    title: 'Top Sensory & Fidget Desk Toys',
    see_more_url: '/search?category=Toys %26 Games',
    see_more_text: 'Shop all sensory & desk toys',
    items: [
      {
        title: 'Silicone Magnetic Balls Sensory Fidget (4-Pack)',
        label: 'Stress Relief Balls',
        image: '/images/products/silicone-magnetic-balls-1.svg',
        url: '/product/silicone-magnetic-balls-fidget-toys',
      },
      {
        title: 'Magnetic Modular Pen with Stylus',
        label: 'Decompression Pen',
        image: '/images/products/magnetic-pen-1.svg',
        url: '/product/magnetic-pen-fidget-decompression-toy',
      },
      {
        title: 'Anti-Gravity Levitating Floating Globe',
        label: 'Levitating Tech',
        image: '/images/products/levitating-globe-1.svg',
        url: '/product/anti-gravity-levitating-magnetic-floating-desk-globe',
      },
      {
        title: 'Kawaii Mochi Squishy Sensory Pack',
        label: 'Squishy Packs',
        image: '/images/tiles/squishy-packs.svg',
        url: '/search?category=Toys %26 Games',
      },
    ],
  },
  {
    id: 'quad-under25',
    title: 'Top Finds Under $25',
    see_more_url: '/search?price=0-25',
    see_more_text: 'Shop value deals',
    items: [
      {
        title: 'Smart Gravity Coffee Mug Warmer',
        label: 'Mug Warmers',
        image: '/images/products/smart-mug-warmer-1.svg',
        url: '/product/smart-gravity-induction-coffee-mug-warmer',
      },
      {
        title: 'Modular Touch EDC Pens',
        label: 'Stylus Pens',
        image: '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg',
        url: '/search?price=0-25',
      },
      {
        title: 'Tactile Neodymium Spheres',
        label: 'Sensory Gadgets',
        image: '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg',
        url: '/product/silicone-magnetic-balls-fidget-toys',
      },
      {
        title: 'RGB High-Speed Charging Cable',
        label: 'Fast Cables',
        image: '/images/products/rgb-cable-1.svg',
        url: '/search?price=0-25',
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
        title: 'Ultrasonic Flame Light Aroma Diffuser',
        label: 'Aroma Diffusers',
        image: '/images/products/flame-diffuser-1.svg',
        url: '/product/handcrafted-ultrasonic-aroma-diffuser-flame-light',
      },
      {
        title: 'Constant Temperature Desktop Mug Warmer',
        label: 'Desk Heating',
        image: '/images/products/smart-mug-warmer-1.svg',
        url: '/product/smart-gravity-induction-coffee-mug-warmer',
      },
      {
        title: 'C-Shape Magnetic Floating Globe',
        label: 'Desk Decor',
        image: '/images/products/levitating-globe-1.svg',
        url: '/product/anti-gravity-levitating-magnetic-floating-desk-globe',
      },
      {
        title: 'Magnetic Cable Management Orbs',
        label: 'Desk Organization',
        image: '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg',
        url: '/search?category=Home %26 Kitchen',
      },
    ],
  },
  {
    id: 'quad-global',
    title: 'Trending Global Drops',
    see_more_url: '/search?sort=bestsellers',
    see_more_text: 'See all trending arrivals',
    items: [
      {
        title: 'Printify 300DPI Graphic Streetwear Drops',
        label: 'Streetwear Drops',
        image: '/images/sample-products/p1-1.jpg',
        url: '/search?category=Apparel %26 Merch',
      },
      {
        title: 'Next-Gen Wireless ANC Audio',
        label: 'Smart Audio',
        image: '/images/products/anc-earbuds-1.svg',
        url: '/search?category=Electronics %26 Gadgets',
      },
      {
        title: 'Magnetic Neodymium Fidget Spheres',
        label: 'Viral Desk Toys',
        image: '/images/products/silicone-magnetic-balls-1.svg',
        url: '/product/silicone-magnetic-balls-fidget-toys',
      },
      {
        title: 'Flame Simulation Aromatherapy',
        label: 'Ambient Living',
        image: '/images/products/flame-diffuser-1.svg',
        url: '/search?category=Home %26 Kitchen',
      },
    ],
  },
  {
    id: 'quad-bestsellers',
    title: 'Amazon Top 100 Leaderboard',
    see_more_url: '/bestsellers/toys-and-games',
    see_more_text: 'See Top 100 Best Sellers',
    items: [
      {
        title: 'Sensory Magnetic Fidget Toys',
        label: '#1 Best Seller',
        image: '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg',
        url: '/bestsellers/toys-and-games',
      },
      {
        title: 'Cyberpunk 400GSM Boxy Hoodie',
        label: '#1 in Apparel',
        image: '/images/sample-products/p1-1.jpg',
        url: '/search?category=Apparel %26 Merch',
      },
      {
        title: 'Hi-Fi 45dB ANC Wireless Earbuds',
        label: '#1 in Electronics',
        image: '/images/products/anc-earbuds-1.svg',
        url: '/product/active-noise-cancelling-wireless-earbuds-pro',
      },
      {
        title: 'Smart Induction Beverage Warmer',
        label: '#1 in Home',
        image: '/images/products/smart-mug-warmer-1.svg',
        url: '/product/smart-gravity-induction-coffee-mug-warmer',
      },
    ],
  },
  {
    id: 'quad-perks',
    title: 'Omnistu Direct Member Perks',
    see_more_url: '/admin',
    see_more_text: 'View fulfillment & supply hub',
    items: [
      {
        title: 'Fast Express Priority Shipping',
        label: 'USPS Priority',
        image: '/images/tiles/usps-priority.svg',
        url: '/orders',
      },
      {
        title: '30-Day Money-Back Guarantee',
        label: '100% Risk-Free',
        image: '/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg',
        url: '/orders',
      },
      {
        title: '1-Click CJ Direct Fulfillment',
        label: 'Auto Dispatch',
        image: '/images/tiles/auto-dispatch.svg',
        url: '/admin',
      },
      {
        title: '24/7 Priority Customer Care',
        label: 'Dedicated Support',
        image: '/images/tiles/dedicated-support.svg',
        url: '/admin',
      },
    ],
  },
];
