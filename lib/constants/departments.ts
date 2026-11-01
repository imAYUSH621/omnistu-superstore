// Store-owned department list for the home page. The first six are the
// original categories and keep their art. The rest are broad marketplace
// departments chosen from general retail taxonomies (for example Target's
// public shop-all page); this is not a copy or a parity claim of any
// other store's list. A department with no products shows "No items yet".
export type Department = { name: string; image: string };

export const DEPARTMENTS: readonly Department[] = [
  { name: 'Gourmet & Indian Food', image: '/images/categories/gourmet-indian-food.jpg' },
  { name: 'Tech & Gadgets', image: '/images/categories/tech-gadgets.jpg' },
  { name: 'Jewelry & Watches', image: '/images/categories/jewelry-watches.jpg' },
  { name: 'Home & Lifestyle', image: '/images/categories/home-lifestyle.jpg' },
  { name: 'Custom Apparel', image: '/images/categories/custom-apparel.jpg' },
  { name: 'Toys & Games', image: '/images/categories/toys-games.jpg' },
  { name: 'Beauty & Personal Care', image: '/images/categories/beauty-personal-care.jpg' },
  { name: 'Health & Wellness', image: '/images/categories/health-wellness.jpg' },
  { name: 'Baby & Kids', image: '/images/categories/baby-kids.jpg' },
  { name: 'Sports & Outdoors', image: '/images/categories/sports-outdoors.jpg' },
  { name: 'Pet Supplies', image: '/images/categories/pet-supplies.jpg' },
  { name: 'Books & Stationery', image: '/images/categories/books-stationery.jpg' },
  { name: 'Arts & Crafts', image: '/images/categories/arts-crafts.jpg' },
  { name: 'Musical Instruments', image: '/images/categories/musical-instruments.jpg' },
  { name: 'Household Essentials', image: '/images/categories/household-essentials.jpg' },
  { name: 'Garden & Patio', image: '/images/categories/garden-patio.jpg' },
  { name: 'Automotive & Tools', image: '/images/categories/automotive-tools.jpg' },
  { name: 'Luggage & Travel', image: '/images/categories/luggage-travel.jpg' },
];
