const sampleData = {
  users: [
    {
      name: 'John',
      email: 'admin@example.com',
      password: '', // replaced at seed time - see db/seed.ts
      role: 'admin',
    },
    {
      name: 'Jane',
      email: 'user@example.com',
      password: '', // replaced at seed time - see db/seed.ts
      role: 'user',
    },
  ],
  products: [
    {
      name: 'Royal Kashmiri Mongra Saffron (2g)',
      slug: 'royal-kashmiri-mongra-saffron',
      category: 'Gourmet & Indian Food',
      description:
        'Kashmiri Mongra saffron threads sourced from Pampore, vacuum sealed in a glass jar. Grade and origin are supplier-stated and not independently verified by Omnistu.',
      images: [
        '/images/products/placeholder.svg',
      ],
      price: 24.99,
      brand: 'Omnistu Royal Gourmet',
      rating: 0,
      numReviews: 0,
      stock: 50,
      isFeatured: true,
      banner: '/images/banner-omnistu-1.svg',
    },
    {
      name: 'Automatic Mechanical Luxury Chronograph Watch',
      slug: 'automatic-mechanical-luxury-chronograph-watch',
      category: 'Jewelry & Watches',
      description:
        'Precision automatic self-winding luxury chronograph crafted from surgical 316L stainless steel with scratch-resistant sapphire crystal and exhibition caseback. 50M water resistance.',
      images: [
        '/images/products/placeholder.svg',
      ],
      price: 79.99,
      brand: 'Omnistu Horology',
      rating: 0,
      numReviews: 0,
      stock: 25,
      isFeatured: true,
      banner: '/images/banner-omnistu-2.svg',
    },
    {
      name: 'Omnistu Cyber Heavyweight Graphic Hoodie (300DPI Printify Drop)',
      slug: 'omnistu-cyber-heavyweight-graphic-hoodie',
      category: 'Apparel & Merch',
      description:
        '400GSM ultra-dense organic French Terry cotton streetwear hoodie. Features cybernetic high-density back print engineered at 300DPI, dropped shoulder oversized silhouette, and double-lined thermal hood.',
      images: [
        '/images/products/placeholder.svg',
      ],
      price: 58.95,
      brand: 'Omnistu Apparel',
      rating: 0,
      numReviews: 0,
      stock: 24,
      isFeatured: true,
      banner: '/images/banner-omnistu-1.svg',
    },
    {
      name: 'Active Noise-Cancelling Wireless Earbuds Pro',
      slug: 'active-noise-cancelling-wireless-earbuds-pro',
      category: 'Electronics & Gadgets',
      description:
        'Hybrid 45dB Active Noise Cancellation with Transparency Mode, 12mm titanium diaphragm dynamic drivers, Bluetooth 5.4 ultra-low latency, and 38-hour battery life with wireless charging case.',
      images: [
        '/images/products/anc-earbuds-1.svg',
      ],
      price: 49.99,
      brand: 'Omnistu Audio',
      rating: 0,
      numReviews: 0,
      stock: 8,
      isFeatured: true,
      banner: '/images/banner-omnistu-2.svg',
    },
    {
      name: 'MagSafe Fast Wireless Magnetic Power Bank 10000mAh',
      slug: 'magsafe-fast-wireless-magnetic-power-bank',
      category: 'Electronics & Gadgets',
      description:
        'Slim 15W Qi-compatible magnetic wireless power bank with 20W USB-C Power Delivery fast charging. Ultra-strong N52 neodymium magnetic ring locks firmly to iPhone and magnetic cases without slippage.',
      images: [
        '/images/products/magsafe-powerbank-1.svg',
      ],
      price: 39.95,
      brand: 'Omnistu Power',
      rating: 0,
      numReviews: 0,
      stock: 18,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Smart Gravity Induction Constant Temperature Coffee Mug Warmer',
      slug: 'smart-gravity-induction-coffee-mug-warmer',
      category: 'Home & Kitchen',
      description:
        'Intelligent desktop beverage warmer with auto shut-off, waterproof tempered glass surface, and 3 adjustable temperature settings (131°F / 149°F / 167°F) to keep coffee, tea, and milk perfectly warm all day.',
      images: [
        '/images/products/smart-mug-warmer-1.svg',
      ],
      price: 24.99,
      brand: 'Omnistu Living',
      rating: 0,
      numReviews: 0,
      stock: 12,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Omnistu Vintage Wash Streetwear Oversized Tee',
      slug: 'omnistu-vintage-wash-streetwear-oversized-tee',
      category: 'Apparel & Merch',
      description:
        '280GSM heavy combed cotton oversized boxy fit t-shirt with enzyme wash treatment. Pre-shrunk with reinforced ribbed collar and seamless tubular body construction for maximum streetwear aesthetic.',
      images: [
        '/images/products/placeholder.svg',
      ],
      price: 34.95,
      brand: 'Omnistu Apparel',
      rating: 0,
      numReviews: 0,
      stock: 35,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Anti-Gravity Levitating Magnetic Floating Desk Globe',
      slug: 'anti-gravity-levitating-magnetic-floating-desk-globe',
      category: 'Toys & Games',
      description:
        'Fascinating C-shaped magnetic levitation globe with colorful circular LED illumination. The globe floats smoothly in mid-air and spins with a gentle touch, making it the ultimate office conversation piece.',
      images: [
        '/images/products/levitating-globe-1.svg',
      ],
      price: 42.50,
      brand: 'Omnistu DeskLab',
      rating: 0,
      numReviews: 0,
      stock: 4,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Handcrafted Ultrasonic Aroma Diffuser with Flame Light Effect',
      slug: 'handcrafted-ultrasonic-aroma-diffuser-flame-light',
      category: 'Home & Kitchen',
      description:
        'Soothing realistic flame simulation atmosphere light combined with high-frequency ultrasonic cool mist aromatherapy. 200ml capacity with waterless auto shut-off protection for bedroom and meditation.',
      images: [
        '/images/products/flame-diffuser-1.svg',
      ],
      price: 29.99,
      brand: 'Omnistu Living',
      rating: 0,
      numReviews: 0,
      stock: 22,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Polo Sporting Stretch Shirt',
      slug: 'polo-sporting-stretch-shirt',
      category: "Men's Dress Shirts",
      description:
        'Classic polo tailored dress shirt with engineered 4-way stretch fabric for all-day comfort and wrinkle resistance.',
      images: [
        '/images/sample-products/p1-1.jpg',
        '/images/sample-products/p1-2.jpg',
      ],
      price: 59.99,
      brand: 'Polo',
      rating: 0,
      numReviews: 0,
      stock: 15,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Brooks Brothers Long Sleeved Shirt',
      slug: 'brooks-brothers-long-sleeved-shirt',
      category: "Men's Dress Shirts",
      description:
        'Timeless executive dress shirt tailored from 100% Supima cotton with non-iron finish and mother-of-pearl buttons.',
      images: [
        '/images/sample-products/p2-1.jpg',
        '/images/sample-products/p2-2.jpg',
      ],
      price: 85.90,
      brand: 'Brooks Brothers',
      rating: 0,
      numReviews: 0,
      stock: 10,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'RGB Flowing Light 100W Fast-Charging Braided Cable',
      slug: 'rgb-flowing-light-fast-charging-cable',
      category: 'Electronics & Gadgets',
      description:
        'Eye-catching dynamic gradient flowing LED illumination that visually indicates charging speed. Zinc alloy connectors with durable nylon braided sheath supporting up to 100W Power Delivery.',
      images: [
        '/images/products/rgb-cable-1.svg',
      ],
      price: 14.95,
      brand: 'Omnistu Power',
      rating: 0,
      numReviews: 0,
      stock: 50,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Authentic Masala Chai Tea Blend (Assam CTC Black Tea Infused with Cardamom, Cinnamon, Cloves & Ginger, 500g Ti',
      slug: 'authentic-masala-chai-tea-blend-assam-ctc-black-tea-infused-with-carda',
      category: 'Gourmet & Indian Food',
      description: 'Authentic Masala Chai Tea Blend (Assam CTC Black Tea Infused with Cardamom, Cinnamon, Cloves & Ginger, 500g Tin) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/authentic-masala-chai-tea-blend-assam-ctc-black-tea-infused-with-carda-1.jpg',
        '/images/sample-products/authentic-masala-chai-tea-blend-assam-ctc-black-tea-infused-with-carda-2.jpg'
      ],
      price: 16.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Artisan Indian Spice Box Kit (7 Whole Organic Spices: Green Cardamom, Star Anise, Kashmiri Chili, Cumin, Musta',
      slug: 'artisan-indian-spice-box-kit-7-whole-organic-spices-green-cardamom-sta',
      category: 'Gourmet & Indian Food',
      description: 'Artisan Indian Spice Box Kit (7 Whole Organic Spices: Green Cardamom, Star Anise, Kashmiri Chili, Cumin, Mustard, Turmeric, Coriander, 700g) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/artisan-indian-spice-box-kit-7-whole-organic-spices-green-cardamom-sta-1.jpg'
      ],
      price: 29.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Single-Estate Darjeeling First Flush Champagne Tea (100% Handpicked Loose Leaf Organic Black Tea, 250g Airtigh',
      slug: 'single-estate-darjeeling-first-flush-champagne-tea-100-handpicked-loos',
      category: 'Gourmet & Indian Food',
      description: 'Single-Estate Darjeeling First Flush Champagne Tea (100% Handpicked Loose Leaf Organic Black Tea, 250g Airtight Caddy) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/single-estate-darjeeling-first-flush-champagne-tea-100-handpicked-loos-1.jpg'
      ],
      price: 21.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Alphonso Mango Pulp Puree (100% Ratnagiri Hapus Pure Alphonso, No Added Preservatives, Pack of 2 x 850g)',
      slug: 'alphonso-mango-pulp-puree-100-ratnagiri-hapus-pure-alphonso-no-added-p',
      category: 'Gourmet & Indian Food',
      description: 'Alphonso Mango Pulp Puree (100% Ratnagiri Hapus Pure Alphonso, No Added Preservatives, Pack of 2 x 850g) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/alphonso-mango-pulp-puree-100-ratnagiri-hapus-pure-alphonso-no-added-p-1.jpg'
      ],
      price: 18.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'A2 Vedic Desi Gir Cow Cultured Ghee (Traditional Bilona Method, Grass-Fed, Lab Certified 100% Pure, 500ml Glas',
      slug: 'a2-vedic-desi-gir-cow-cultured-ghee-traditional-bilona-method-grass-fe',
      category: 'Gourmet & Indian Food',
      description: 'A2 Vedic Desi Gir Cow Cultured Ghee (Traditional Bilona Method, Grass-Fed, Lab Certified 100% Pure, 500ml Glass Jar) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/a2-vedic-desi-gir-cow-cultured-ghee-traditional-bilona-method-grass-fe-1.jpg'
      ],
      price: 34.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Royal Aged Basmati Rice (2-Year Aged Extra Long Grain Premium Biryani Rice, Naturally Aromatic, 5kg Burlap Sac',
      slug: 'royal-aged-basmati-rice-2-year-aged-extra-long-grain-premium-biryani-r',
      category: 'Gourmet & Indian Food',
      description: 'Royal Aged Basmati Rice (2-Year Aged Extra Long Grain Premium Biryani Rice, Naturally Aromatic, 5kg Burlap Sack) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/royal-aged-basmati-rice-2-year-aged-extra-long-grain-premium-biryani-r-1.jpg'
      ],
      price: 26.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Royal Heritage Indian Festive Sweet & Savory Hamper (Kaju Katli, Gulab Jamun, Roasted Spiced Cashews, 1kg Luxu',
      slug: 'royal-heritage-indian-festive-sweet-savory-hamper-kaju-katli-gulab-jam',
      category: 'Gourmet & Indian Food',
      description: 'Royal Heritage Indian Festive Sweet & Savory Hamper (Kaju Katli, Gulab Jamun, Roasted Spiced Cashews, 1kg Luxury Gift Box) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/royal-heritage-indian-festive-sweet-savory-hamper-kaju-katli-gulab-jam-1.jpg'
      ],
      price: 38.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Pro ANC Active Noise Cancelling Wireless Earbuds (Spatial Audio, Bluetooth 5.4, 48H Battery, IPX7 Waterproof)',
      slug: 'pro-anc-active-noise-cancelling-wireless-earbuds-spatial-audio-bluetoo',
      category: 'Tech & Gadgets',
      description: 'Pro ANC Active Noise Cancelling Wireless Earbuds (Spatial Audio, Bluetooth 5.4, 48H Battery, IPX7 Waterproof) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/pro-anc-active-noise-cancelling-wireless-earbuds-spatial-audio-bluetoo-1.jpg'
      ],
      price: 39.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: '100W GaN III 4-Port Fast Desktop Charger (3x USB-C PD 3.0, 1x USB-A QC 4+, Universal Travel Compatibility for ',
      slug: '100w-gan-iii-4-port-fast-desktop-charger-3x-usb-c-pd-3-0-1x-usb-a-qc-4',
      category: 'Tech & Gadgets',
      description: '100W GaN III 4-Port Fast Desktop Charger (3x USB-C PD 3.0, 1x USB-A QC 4+, Universal Travel Compatibility for MacBook, iPhone, Galaxy) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/100w-gan-iii-4-port-fast-desktop-charger-3x-usb-c-pd-3-0-1x-usb-a-qc-4-1.jpg'
      ],
      price: 44.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Smart Titanium Health & Fitness Tracking Ring (Continuous Heart Rate, Sleep Stages, HRV & SpO2 Sensor, 7-Day B',
      slug: 'smart-titanium-health-fitness-tracking-ring-continuous-heart-rate-slee',
      category: 'Tech & Gadgets',
      description: 'Smart Titanium Health & Fitness Tracking Ring (Continuous Heart Rate, Sleep Stages, HRV & SpO2 Sensor, 7-Day Battery, IP68 5ATM Waterproof) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/smart-titanium-health-fitness-tracking-ring-continuous-heart-rate-slee-1.jpg'
      ],
      price: 79.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: '2.0 Carat D-Color VVS1 Moissanite Solitaire Engagement Ring in 18K White Gold Plated 925 Sterling Silver with ',
      slug: '2-0-carat-d-color-vvs1-moissanite-solitaire-engagement-ring-in-18k-whi',
      category: 'Jewelry & Watches',
      description: '2.0 Carat D-Color VVS1 Moissanite Solitaire Engagement Ring in 18K White Gold Plated 925 Sterling Silver with GRA Certificate Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/2-0-carat-d-color-vvs1-moissanite-solitaire-engagement-ring-in-18k-whi-1.jpg'
      ],
      price: 64.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Italian 18K Gold Plated 925 Sterling Silver Miami Cuban Link Chain Necklace (8mm Width, Diamond-Cut Solid Link',
      slug: 'italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec',
      category: 'Jewelry & Watches',
      description: 'Italian 18K Gold Plated 925 Sterling Silver Miami Cuban Link Chain Necklace (8mm Width, Diamond-Cut Solid Link, Hypoallergenic) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec-1.jpg'
      ],
      price: 54.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Heavyweight French Terry Oversized Streetwear Hoodie (450 GSM 100% Combed Organic Cotton, Pre-Shrunk, Minimali',
      slug: 'heavyweight-french-terry-oversized-streetwear-hoodie-450-gsm-100-combe',
      category: 'Custom Apparel',
      description: 'Heavyweight French Terry Oversized Streetwear Hoodie (450 GSM 100% Combed Organic Cotton, Pre-Shrunk, Minimalist Luxury Fit) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/heavyweight-french-terry-oversized-streetwear-hoodie-450-gsm-100-combe-1.jpg'
      ],
      price: 48.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Vintage Washed Boxy Fit Graphic Tee (260 GSM Heavyweight Jersey Cotton, Drop Shoulder, Fade Resistant)',
      slug: 'vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton-',
      category: 'Custom Apparel',
      description: 'Vintage Washed Boxy Fit Graphic Tee (260 GSM Heavyweight Jersey Cotton, Drop Shoulder, Fade Resistant) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg'
      ],
      price: 28.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Japanese Raw Selvedge Denim Overshirt Jacket (14.5oz Kuroki Mill Denim, Custom Gunmetal Hardware, Reinforced T',
      slug: 'japanese-raw-selvedge-denim-overshirt-jacket-14-5oz-kuroki-mill-denim-',
      category: 'Custom Apparel',
      description: 'Japanese Raw Selvedge Denim Overshirt Jacket (14.5oz Kuroki Mill Denim, Custom Gunmetal Hardware, Reinforced Triple Stitching) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/japanese-raw-selvedge-denim-overshirt-jacket-14-5oz-kuroki-mill-denim--1.jpg'
      ],
      price: 78.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Artisan Matte Ceramic Pour-Over Coffee Brewer Station (Double-Wall Borosilicate Carafe, Laser-Etched Reusable ',
      slug: 'artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro',
      category: 'Home & Lifestyle',
      description: 'Artisan Matte Ceramic Pour-Over Coffee Brewer Station (Double-Wall Borosilicate Carafe, Laser-Etched Reusable Stainless Filter, 800ml) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg'
      ],
      price: 36.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Ultrasonic Flame Atmosphere Essential Oil Diffuser (Realistic LED Fire Effect, Ultra-Quiet Whisper Humidifier,',
      slug: 'ultrasonic-flame-atmosphere-essential-oil-diffuser-realistic-led-fire-',
      category: 'Home & Lifestyle',
      description: 'Ultrasonic Flame Atmosphere Essential Oil Diffuser (Realistic LED Fire Effect, Ultra-Quiet Whisper Humidifier, Auto Shut-Off, 250ml) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/ultrasonic-flame-atmosphere-essential-oil-diffuser-realistic-led-fire--1.jpg'
      ],
      price: 29.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Precision Aerospace Aluminum Optical Illusion Kinetic Desk Toy (Full Spherical CNC Machined Helix, Silent Stai',
      slug: 'precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp',
      category: 'Toys & Games',
      description: 'Precision Aerospace Aluminum Optical Illusion Kinetic Desk Toy (Full Spherical CNC Machined Helix, Silent Stainless Steel Bearing) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/precision-aerospace-aluminum-optical-illusion-kinetic-desk-toy-full-sp-1.jpg'
      ],
      price: 24.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: 'Artisan Laser-Cut Wooden Mechanical Gear Treasure Box (3D Self-Assembly Engineering Puzzle, No Glue Required, ',
      slug: 'artisan-laser-cut-wooden-mechanical-gear-treasure-box-3d-self-assembly',
      category: 'Toys & Games',
      description: 'Artisan Laser-Cut Wooden Mechanical Gear Treasure Box (3D Self-Assembly Engineering Puzzle, No Glue Required, Secret Compartment) Demo sample product - no real supplier, stock, or fulfillment exists.',
      images: [
        '/images/sample-products/artisan-laser-cut-wooden-mechanical-gear-treasure-box-3d-self-assembly-1.jpg'
      ],
      price: 32.99,
      brand: 'Omnistu Sample (demo)',
      // No reviews collected on this storefront yet - start at zero rather
      // than importing unverifiable source-site ratings.
      rating: 0,
      numReviews: 0,
      // STAGED: live availability, variant, price and shipping are not
      // yet verified with a supplier, so these stay non-purchasable
      // (stock 0) until validated against a real supplier connection.
      stock: 0,
      isFeatured: false,
      banner: null,
    },
  ],
};

export default sampleData;
