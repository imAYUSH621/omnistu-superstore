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

export const AMAZON_GATEWAY_QUADS: GatewayQuad[] = [
  {
    "id": "amazon-gw-quad-1",
    "title": "Plug in with our electronics",
    "items": [
      {
        "label": "Headphones", "image": "/images/sample-products/pro-anc-active-noise-cancelling-wireless-earbuds-spatial-audio-bluetoo-1.jpg",
        "url": "/s?k=headphones"
      },
      {
        "label": "Tablets", "image": "/images/tiles/tablets.svg",
        "url": "/s?k=electronics%20tablets"
      },
      {
        "label": "Gaming", "image": "/images/tiles/gaming.svg",
        "url": "/s?k=gaming%20equipment"
      },
      {
        "label": "Speakers", "image": "/images/tiles/speakers.svg",
        "url": "/s?k=speakers"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Plug in with our electronics"
  },
  {
    "id": "amazon-gw-quad-2",
    "title": "Score the top PCs & Accessories",
    "items": [
      {
        "label": "Desktops", "image": "/images/tiles/desktops.svg",
        "url": "/s?k=desktop%20computers"
      },
      {
        "label": "Laptops", "image": "/images/tiles/laptops.svg",
        "url": "/s?k=laptops"
      },
      {
        "label": "Hard Drives", "image": "/images/tiles/hard-drives.svg",
        "url": "/s?k=external%20hard%20drives"
      },
      {
        "label": "PC Accessories", "image": "/images/tiles/pc-accessories.svg",
        "url": "/s?k=computer%20accessories"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Score the top PCs & Accessories"
  },
  {
    "id": "amazon-gw-quad-3",
    "title": "Gear up to get fit",
    "items": [
      {
        "label": "Clothing", "image": "/images/sample-products/heavyweight-french-terry-oversized-streetwear-hoodie-450-gsm-100-combe-1.jpg",
        "url": "/s?k=fitness%20clothing"
      },
      {
        "label": "Trackers", "image": "/images/sample-products/smart-titanium-health-fitness-tracking-ring-continuous-heart-rate-slee-1.jpg",
        "url": "/s?k=fitness%20trackers"
      },
      {
        "label": "Equipment", "image": "/images/tiles/equipment.svg",
        "url": "/s?k=fitness%20equipment"
      },
      {
        "label": "Deals", "image": "/images/tiles/deals.svg",
        "url": "/s?k=fitness"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Gear up to get fit"
  },
  {
    "id": "amazon-gw-quad-4",
    "title": "Apparel under $25",
    "items": [
      {
        "label": "Women", "image": "/images/tiles/women.svg",
        "url": "/s?k=Women%20Clothing"
      },
      {
        "label": "Men", "image": "/images/tiles/men.svg",
        "url": "/s?k=Men%20Clothing"
      },
      {
        "label": "Girls", "image": "/images/tiles/girls.svg",
        "url": "/s?k=Girls%20Fashion"
      },
      {
        "label": "Boys", "image": "/images/tiles/boys.svg",
        "url": "/s?k=Boys%20Fashion"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Apparel under $25"
  },
  {
    "id": "amazon-gw-quad-5",
    "title": "Fantastic Finds for Home",
    "items": [
      {
        "label": "Kitchen", "image": "/images/sample-products/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg",
        "url": "/s?k=kitchen"
      },
      {
        "label": "Home Decor", "image": "/images/sample-products/ultrasonic-flame-atmosphere-essential-oil-diffuser-realistic-led-fire--1.jpg",
        "url": "/s?k=home%20decor"
      },
      {
        "label": "Dining", "image": "/images/sample-products/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg",
        "url": "/s?k=kitchen%20and%20dining"
      },
      {
        "label": "Smart Home", "image": "/images/sample-products/ultrasonic-flame-atmosphere-essential-oil-diffuser-realistic-led-fire--1.jpg",
        "url": "/s?k=smart%20home"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Fantastic Finds for Home"
  },
  {
    "id": "amazon-gw-quad-6",
    "title": "Shine brighter with your fashion faves",
    "items": [
      {
        "label": "Jewelry", "image": "/images/sample-products/italian-18k-gold-plated-925-sterling-silver-miami-cuban-link-chain-nec-1.jpg",
        "url": "/s?k=jewelry"
      },
      {
        "label": "Handbags", "image": "/images/tiles/handbags.svg",
        "url": "/s?k=handbags"
      },
      {
        "label": "Footwear", "image": "/images/tiles/footwear.svg",
        "url": "/s?k=women%20footwear"
      },
      {
        "label": "Beauty", "image": "/images/tiles/beauty.svg",
        "url": "/s?k=beauty"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Shine brighter with your fashion faves"
  },
  {
    "id": "amazon-gw-quad-7",
    "title": "Unveil your radiance",
    "items": [
      {
        "label": "Hair Care", "image": "/images/tiles/hair-care.svg",
        "url": "/s?k=hair%20care"
      },
      {
        "label": "Fragrances", "image": "/images/tiles/fragrances.svg",
        "url": "/s?k=fragrances"
      },
      {
        "label": "Make-up", "image": "/images/tiles/make-up.svg",
        "url": "/s?k=Make%20up"
      },
      {
        "label": "Skin Care", "image": "/images/tiles/skin-care.svg",
        "url": "/s?k=skin%20care"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Unveil your radiance"
  },
  {
    "id": "amazon-gw-quad-8",
    "title": "Level up your PC here",
    "items": [
      {
        "label": "Laptops", "image": "/images/tiles/laptops.svg",
        "url": "/s?k=laptops"
      },
      {
        "label": "PCs", "image": "/images/tiles/pcs.svg",
        "url": "/s?k=desktop%20PCs"
      },
      {
        "label": "Hard Drives", "image": "/images/tiles/hard-drives.svg",
        "url": "/s?k=hard%20drives"
      },
      {
        "label": "Monitors", "image": "/images/tiles/monitors.svg",
        "url": "/s?k=computer%20monitors"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Level up your PC here"
  },
  {
    "id": "amazon-gw-quad-9",
    "title": "Fashion trends in Shoes",
    "items": [
      {
        "label": "Women's", "image": "/images/tiles/women-s.svg",
        "url": "/s?k=WOmen%20Shoes"
      },
      {
        "label": "Men's", "image": "/images/tiles/men-s.svg",
        "url": "/s?k=Men%20Shoes"
      },
      {
        "label": "Kids'", "image": "/images/tiles/kids.svg",
        "url": "/s?k=Kid%20Shoes"
      },
      {
        "label": "All shoes", "image": "/images/tiles/all-shoes.svg",
        "url": "/s?k=Shoes"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Fashion trends in Shoes"
  },
  {
    "id": "amazon-gw-quad-10",
    "title": "Home harmony",
    "items": [
      {
        "label": "Kitchen essentials", "image": "/images/sample-products/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg",
        "url": "/s?k=kitchen%20essentials"
      },
      {
        "label": "Home comfort", "image": "/images/sample-products/ultrasonic-flame-atmosphere-essential-oil-diffuser-realistic-led-fire--1.jpg",
        "url": "/s?k=home%20sofa%20living%20room"
      },
      {
        "label": "Decorate with elegance", "image": "/images/tiles/decorate-with-elegance.svg",
        "url": "/s?k=home%20decor"
      },
      {
        "label": "Light it Right", "image": "/images/tiles/light-it-right.svg",
        "url": "/s?k=Home%20decor"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Home harmony"
  },
  {
    "id": "amazon-gw-quad-11",
    "title": "Shoes Under $50",
    "items": [
      {
        "label": "Women's", "image": "/images/tiles/women-s.svg",
        "url": "/s?k=women%20footwear"
      },
      {
        "label": "Men's", "image": "/images/tiles/men-s.svg",
        "url": "/s?k=men%20footwear"
      },
      {
        "label": "Girl's", "image": "/images/tiles/girl-s.svg",
        "url": "/s?k=girls%20footwear"
      },
      {
        "label": "Boy's", "image": "/images/tiles/boy-s.svg",
        "url": "/s?k=boys%20footwear"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Shoes Under $50"
  },
  {
    "id": "amazon-gw-quad-12",
    "title": "What you need for furry friends",
    "items": [
      {
        "label": "Dogs", "image": "/images/tiles/dogs.svg",
        "url": "/s?k=pet%20dog%20supplies"
      },
      {
        "label": "Cats", "image": "/images/tiles/cats.svg",
        "url": "/s?k=pet%20cat%20supplies"
      },
      {
        "label": "Small Pets", "image": "/images/tiles/small-pets.svg",
        "url": "/s?k=small%20pet%20supplies"
      },
      {
        "label": "Deals", "image": "/images/tiles/deals.svg",
        "url": "/s?k=Deals"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=What you need for furry friends"
  },
  {
    "id": "amazon-gw-quad-13",
    "title": "Video games & accessories",
    "items": [
      {
        "label": "Xbox controllers", "image": "/images/tiles/xbox-controllers.svg",
        "url": "/s?k=xbox%20controller"
      },
      {
        "label": "Nintendo", "image": "/images/tiles/nintendo.svg",
        "url": "/s?k=Nintendo"
      },
      {
        "label": "VR headsets", "image": "/images/tiles/vr-headsets.svg",
        "url": "/s?k=vr%20headset"
      },
      {
        "label": "PS5 accessories", "image": "/images/tiles/ps5-accessories.svg",
        "url": "/s?k=ps5%20accessories"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Video games & accessories"
  },
  {
    "id": "amazon-gw-quad-14",
    "title": "Have more fun with the family",
    "items": [
      {
        "label": "Outdoor Play Sets", "image": "/images/tiles/outdoor-play-sets.svg",
        "url": "/s?k=outdoor%20play%20toys"
      },
      {
        "label": "Learning Toys", "image": "/images/tiles/learning-toys.svg",
        "url": "/s?k=learning%20toys"
      },
      {
        "label": "Action Figures", "image": "/images/tiles/action-figures.svg",
        "url": "/s?k=action%20figures"
      },
      {
        "label": "Pretend Play Toys", "image": "/images/tiles/pretend-play-toys.svg",
        "url": "/s?k=Pretend%20Play%20Toys"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Have more fun with the family"
  },
  {
    "id": "amazon-gw-quad-15",
    "title": "Finds in Home",
    "items": [
      {
        "label": "Bedsheets", "image": "/images/tiles/bedsheets.svg",
        "url": "/s?k=Bedsheets"
      },
      {
        "label": "Pillows", "image": "/images/tiles/pillows.svg",
        "url": "/s?k=Pillows"
      },
      {
        "label": "Duvet Covers", "image": "/images/tiles/duvet-covers.svg",
        "url": "/s?k=duvet%20covers"
      },
      {
        "label": "Throws", "image": "/images/tiles/throws.svg",
        "url": "/s?k=Throws"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Finds in Home"
  },
  {
    "id": "amazon-gw-quad-16",
    "title": "Deals on top categories",
    "items": [
      {
        "label": "Books", "image": "/images/tiles/books.svg",
        "url": "/s?k=Books"
      },
      {
        "label": "Fashion", "image": "/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg",
        "url": "/s?k=Fashion"
      },
      {
        "label": "PCPC", "image": "/images/tiles/pcpc.svg",
        "url": "/s?k=PCPC"
      },
      {
        "label": "Beauty", "image": "/images/tiles/beauty.svg",
        "url": "/s?k=Beauty"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Deals on top categories"
  },
  {
    "id": "amazon-gw-quad-17",
    "title": "New home arrivals under $50",
    "items": [
      {
        "label": "Kitchen & dining", "image": "/images/sample-products/artisan-matte-ceramic-pour-over-coffee-brewer-station-double-wall-boro-1.jpg",
        "url": "/s?k=kitchen%20and%20dining"
      },
      {
        "label": "Home improvement", "image": "/images/tiles/home-improvement.svg",
        "url": "/s?k=home%20improvement"
      },
      {
        "label": "D\u00e9cor", "image": "/images/tiles/d-u00e9cor.svg",
        "url": "/s?k=home%20decor"
      },
      {
        "label": "Bedding & bath", "image": "/images/tiles/bedding-bath.svg",
        "url": "/s?k=bedding%20and%20bath"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=New home arrivals under $50"
  },
  {
    "id": "amazon-gw-quad-18",
    "title": "Discover the latest arrivals",
    "items": [
      {
        "label": "Electronics", "image": "/images/tiles/electronics.svg",
        "url": "/s?k=electronics"
      },
      {
        "label": "Home", "image": "/images/tiles/home.svg",
        "url": "/s?k=home"
      },
      {
        "label": "Beauty", "image": "/images/tiles/beauty.svg",
        "url": "/s?k=beauty"
      },
      {
        "label": "Fashion", "image": "/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg",
        "url": "/s?k=fashion"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Discover the latest arrivals"
  },
  {
    "id": "amazon-gw-quad-19",
    "title": "Accessorize your life",
    "items": [
      {
        "label": "Fashion accessories", "image": "/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg",
        "url": "/s?k=fashion%20accessories"
      },
      {
        "label": "Men's accessories", "image": "/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg",
        "url": "/s?k=men%20accessories"
      },
      {
        "label": "Health and beauty", "image": "/images/tiles/health-and-beauty.svg",
        "url": "/s?k=health%20and%20beauty"
      },
      {
        "label": "Sports", "image": "/images/tiles/sports.svg",
        "url": "/s?k=Sports"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Accessorize your life"
  },
  {
    "id": "amazon-gw-quad-20",
    "title": "Step into style",
    "items": [
      {
        "label": "Women's clothing", "image": "/images/sample-products/heavyweight-french-terry-oversized-streetwear-hoodie-450-gsm-100-combe-1.jpg",
        "url": "/s?k=women%20apparel"
      },
      {
        "label": "Women's shoes", "image": "/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg",
        "url": "/s?k=Women%20shoes"
      },
      {
        "label": "Men's clothing", "image": "/images/sample-products/heavyweight-french-terry-oversized-streetwear-hoodie-450-gsm-100-combe-1.jpg",
        "url": "/s?k=Men%20apparel"
      },
      {
        "label": "Men's shoes", "image": "/images/sample-products/vintage-washed-boxy-fit-graphic-tee-260-gsm-heavyweight-jersey-cotton--1.jpg",
        "url": "/s?k=Men%20shoes"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Step into style"
  },
  {
    "id": "amazon-gw-quad-21",
    "title": "Level up your beauty routine",
    "items": [
      {
        "label": "Makeup", "image": "/images/tiles/makeup.svg",
        "url": "/s?k=makeup"
      },
      {
        "label": "Brushes", "image": "/images/tiles/brushes.svg",
        "url": "/s?k=makeup%20brushes"
      },
      {
        "label": "Sponges", "image": "/images/tiles/sponges.svg",
        "url": "/s?k=makeup%20sponge"
      },
      {
        "label": "Mirrors", "image": "/images/tiles/mirrors.svg",
        "url": "/s?k=makeup%20mirror"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Level up your beauty routine"
  },
  {
    "id": "amazon-gw-quad-22",
    "title": "Handpicked home theater",
    "items": [
      {
        "label": "Televisions", "image": "/images/tiles/televisions.svg",
        "url": "/s?k=television"
      },
      {
        "label": "Speakers", "image": "/images/tiles/speakers.svg",
        "url": "/s?k=speakers"
      },
      {
        "label": "Soundbars", "image": "/images/tiles/soundbars.svg",
        "url": "/s?k=soundbars"
      },
      {
        "label": "Projectors", "image": "/images/tiles/projectors.svg",
        "url": "/s?k=projectors"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Handpicked home theater"
  },
  {
    "id": "amazon-gw-quad-23",
    "title": "Curate your space",
    "items": [
      {
        "label": "Candles", "image": "/images/tiles/candles.svg",
        "url": "/s?k=Candles"
      },
      {
        "label": "Stylish pillows", "image": "/images/tiles/stylish-pillows.svg",
        "url": "/s?k=stylish%20pillows"
      },
      {
        "label": "Indoor gardening", "image": "/images/tiles/indoor-gardening.svg",
        "url": "/s?k=indoor%20gardening"
      },
      {
        "label": "Storage organization", "image": "/images/tiles/storage-organization.svg",
        "url": "/s?k=Storage%20organization"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Curate your space"
  },
  {
    "id": "amazon-gw-quad-24",
    "title": "Look your best this season",
    "items": [
      {
        "label": "For Her", "image": "/images/tiles/for-her.svg",
        "url": "/s?k=woman%20apparel"
      },
      {
        "label": "For Him", "image": "/images/tiles/for-him.svg",
        "url": "/s?k=men%20apparel"
      },
      {
        "label": "For Teens", "image": "/images/tiles/for-teens.svg",
        "url": "/s?k=teen%20apparel"
      },
      {
        "label": "For Kids", "image": "/images/tiles/for-kids.svg",
        "url": "/s?k=kids%20apparel"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Look your best this season"
  },
  {
    "id": "amazon-gw-quad-25",
    "title": "Build your own computer",
    "items": [
      {
        "label": "Processors", "image": "/images/tiles/processors.svg",
        "url": "/s?k=processors"
      },
      {
        "label": "Motherboards", "image": "/images/tiles/motherboards.svg",
        "url": "/s?k=motherboards"
      },
      {
        "label": "Power Supplies", "image": "/images/tiles/power-supplies.svg",
        "url": "/s?k=power%20supply%20pc"
      },
      {
        "label": "Cooling", "image": "/images/tiles/cooling.svg",
        "url": "/s?k=pc%20cooling"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Build your own computer"
  },
  {
    "id": "amazon-gw-quad-26",
    "title": "Books you can't put down",
    "items": [
      {
        "label": "Children's", "image": "/images/tiles/children-s.svg",
        "url": "/s?k=childrens%20books"
      },
      {
        "label": "Mystery", "image": "/images/tiles/mystery.svg",
        "url": "/s?k=Mystery%20books"
      },
      {
        "label": "Fiction", "image": "/images/tiles/fiction.svg",
        "url": "/s?k=Fiction%20books"
      },
      {
        "label": "Motivational books", "image": "/images/tiles/motivational-books.svg",
        "url": "/s?k=motivational%20books"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Books you can't put down"
  }
];
