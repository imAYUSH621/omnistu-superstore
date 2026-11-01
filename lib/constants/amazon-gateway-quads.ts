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

// Honest homepage quads. Every item is a REAL seeded product: its label is
// the real product name, its image is the same file the product page uses,
// its link is the real product page. Only products whose sample image was
// visually verified to match the product are featured (several seeded
// sample photos do not match their product - see finding D21 - those
// products are excluded here rather than mislabeled).
const P = '/images/sample-products';
const prod = (slug: string) => `/product/${slug}`;
const cat = (c: string) => `/search?category=${encodeURIComponent(c)}`;

export const AMAZON_GATEWAY_QUADS: GatewayQuad[] = [
  {
    id: 'gw-gourmet',
    title: 'Royal Gourmet & Indian Food',
    items: [
      { label: 'Masala Chai Tea Blend', image: `${P}/authentic-masala-chai-tea-blend-assam-ctc-black-tea-infused-with-carda-1.jpg`, url: prod('authentic-masala-chai-tea-blend-assam-ctc-black-tea-infused-with-carda') },
      { label: 'Artisan Indian Spice Box Kit', image: `${P}/artisan-indian-spice-box-kit-7-whole-organic-spices-green-cardamom-sta-1.jpg`, url: prod('artisan-indian-spice-box-kit-7-whole-organic-spices-green-cardamom-sta') },
      { label: 'Royal Aged Basmati Rice', image: `${P}/royal-aged-basmati-rice-2-year-aged-extra-long-grain-premium-biryani-r-1.jpg`, url: prod('royal-aged-basmati-rice-2-year-aged-extra-long-grain-premium-biryani-r') },
      { label: 'Darjeeling First Flush Tea', image: `${P}/single-estate-darjeeling-first-flush-champagne-tea-100-handpicked-loos-1.jpg`, url: prod('single-estate-darjeeling-first-flush-champagne-tea-100-handpicked-loos') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Gourmet & Indian Food'),
  },
  {
    id: 'gw-jewelry',
    title: 'Jewelry & Watches',
    items: [
      { label: 'Moissanite Solitaire Ring', image: `${P}/2-0-carat-d-color-vvs1-moissanite-solitaire-engagement-ring-in-18k-whi-1.jpg`, url: prod('2-0-carat-d-color-vvs1-moissanite-solitaire-engagement-ring-in-18k-whi') },
      { label: 'Miami Cuban Link Chain', image: `${P}/italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec-1.jpg`, url: prod('italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Jewelry & Watches'),
  },
  {
    id: 'gw-tech',
    title: 'Tech & Gadgets',
    items: [
      { label: 'ANC Wireless Earbuds', image: `${P}/pro-anc-active-noise-cancelling-wireless-earbuds-spatial-audio-bluetoo-1.jpg`, url: prod('pro-anc-active-noise-cancelling-wireless-earbuds-spatial-audio-bluetoo') },
      { label: '100W GaN Fast Charger', image: `${P}/100w-gan-iii-4-port-fast-desktop-charger-3x-usb-c-pd-3-0-1x-usb-a-qc-4-1.jpg`, url: prod('100w-gan-iii-4-port-fast-desktop-charger-3x-usb-c-pd-3-0-1x-usb-a-qc-4') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Tech & Gadgets'),
  },
  {
    id: 'gw-apparel',
    title: 'Custom Apparel',
    items: [
      { label: 'Selvedge Denim Overshirt', image: `${P}/japanese-raw-selvedge-denim-overshirt-jacket-14-5oz-kuroki-mill-denim--1.jpg`, url: prod('japanese-raw-selvedge-denim-overshirt-jacket-14-5oz-kuroki-mill-denim-') },
    ],
    ctaText: 'See more',
    ctaUrl: cat('Custom Apparel'),
  },
];
