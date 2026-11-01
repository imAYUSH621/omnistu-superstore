export interface QuadItem {
  label: string;
  image: string;
  url: string;
}

export interface GatewayQuad {
  id: string;
  title: string;
  items: QuadItem[];
  ctaText: string;
  ctaUrl: string;
}

// Honest homepage quads: only categories the store actually stocks, only
// real product photography from the sample catalog. The previous 26-quad /
// 85-tile grid used generated placeholder SVGs and linked to searches with
// no results, which overstated catalog breadth (finding X2/D-gap).
const P = '/images/sample-products';
const cat = (c: string) => `/search?category=${encodeURIComponent(c)}`;

export const AMAZON_GATEWAY_QUADS: GatewayQuad[] = [
  {
    id: 'gw-gourmet',
    title: 'Royal Gourmet & Indian Food',
    items: [
      { label: 'Spice Box Kits', image: `${P}/artisan-indian-spice-box-kit-7-whole-organic-spices-green-cardamom-sta-1.jpg`, url: cat('Gourmet & Indian Food') },
      { label: 'Masala Chai', image: `${P}/authentic-masala-chai-tea-blend-assam-ctc-black-tea-infused-with-carda-1.jpg`, url: cat('Gourmet & Indian Food') },
      { label: 'Aged Basmati Rice', image: `${P}/royal-aged-basmati-rice-2-year-aged-extra-long-grain-premium-biryani-r-1.jpg`, url: cat('Gourmet & Indian Food') },
      { label: 'Festive Hampers', image: `${P}/royal-heritage-indian-festive-sweet-savory-hamper-kaju-katli-gulab-jam-1.jpg`, url: cat('Gourmet & Indian Food') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Gourmet & Indian Food'),
  },
  {
    id: 'gw-electronics',
    title: 'Electronics & Gadgets',
    items: [
      { label: 'Wireless Earbuds', image: `${P}/pro-anc-active-noise-cancelling-wireless-earbuds-spatial-audio-bluetoo-1.jpg`, url: cat('Electronics & Gadgets') },
      { label: 'Camera Drones', image: `${P}/4k-ultra-hd-foldable-gps-camera-drone-brushless-motor-obstacle-avoidan-1.jpg`, url: cat('Electronics & Gadgets') },
      { label: 'Fast Chargers', image: `${P}/100w-gan-iii-4-port-fast-desktop-charger-3x-usb-c-pd-3-0-1x-usb-a-qc-4-1.jpg`, url: cat('Electronics & Gadgets') },
      { label: 'Smart Rings', image: `${P}/smart-titanium-health-fitness-tracking-ring-continuous-heart-rate-slee-1.jpg`, url: cat('Electronics & Gadgets') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Electronics & Gadgets'),
  },
  {
    id: 'gw-jewelry',
    title: 'Jewelry & Watches',
    items: [
      { label: 'Engagement Rings', image: `${P}/2-0-carat-d-color-vvs1-moissanite-solitaire-engagement-ring-in-18k-whi-1.jpg`, url: cat('Jewelry & Watches') },
      { label: 'Tennis Bracelets', image: `${P}/artisan-4mm-round-cut-moissanite-tennis-bracelet-4-prong-setting-doubl-1.jpg`, url: cat('Jewelry & Watches') },
      { label: 'Cuban Chains', image: `${P}/italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec-1.jpg`, url: cat('Jewelry & Watches') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Jewelry & Watches'),
  },
  {
    id: 'gw-apparel',
    title: 'Apparel & Merch',
    items: [
      { label: 'Hoodies', image: `${P}/heavyweight-french-terry-oversized-streetwear-hoodie-450-gsm-100-combe-1.jpg`, url: cat('Apparel & Merch') },
      { label: 'Denim Overshirts', image: `${P}/japanese-raw-selvedge-denim-overshirt-jacket-14-5oz-kuroki-mill-denim--1.jpg`, url: cat('Apparel & Merch') },
      { label: 'Graphic Tees', image: `${P}/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg`, url: cat('Apparel & Merch') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Apparel & Merch'),
  },
  {
    id: 'gw-home',
    title: 'Home & Kitchen',
    items: [
      { label: 'Coffee Stations', image: `${P}/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg`, url: cat('Home & Kitchen') },
      { label: 'Aroma Diffusers', image: `${P}/ultrasonic-flame-atmosphere-essential-oil-diffuser-realistic-led-fire--1.jpg`, url: cat('Home & Kitchen') },
      { label: 'Desk Toys', image: `${P}/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg`, url: cat('Home & Kitchen') },
      { label: 'Puzzle Boxes', image: `${P}/artisan-laser-cut-wooden-mechanical-gear-treasure-box-3d-self-assembly-1.jpg`, url: cat('Home & Kitchen') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Home & Kitchen'),
  },
];
