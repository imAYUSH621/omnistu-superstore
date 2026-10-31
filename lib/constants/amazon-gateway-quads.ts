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
        "label": "Headphones",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=headphones"
      },
      {
        "label": "Tablets",
        "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=electronics%20tablets"
      },
      {
        "label": "Gaming",
        "image": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=gaming%20equipment"
      },
      {
        "label": "Speakers",
        "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=85",
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
        "label": "Desktops",
        "image": "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=desktop%20computers"
      },
      {
        "label": "Laptops",
        "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=laptops"
      },
      {
        "label": "Hard Drives",
        "image": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=external%20hard%20drives"
      },
      {
        "label": "PC Accessories",
        "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=85",
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
        "label": "Clothing",
        "image": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=fitness%20clothing"
      },
      {
        "label": "Trackers",
        "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=fitness%20trackers"
      },
      {
        "label": "Equipment",
        "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=fitness%20equipment"
      },
      {
        "label": "Deals",
        "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=85",
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
        "label": "Women",
        "image": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Women%20Clothing"
      },
      {
        "label": "Men",
        "image": "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Men%20Clothing"
      },
      {
        "label": "Girls",
        "image": "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Girls%20Fashion"
      },
      {
        "label": "Boys",
        "image": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&auto=format&fit=crop&q=85",
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
        "label": "Kitchen",
        "image": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=kitchen"
      },
      {
        "label": "Home Decor",
        "image": "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=home%20decor"
      },
      {
        "label": "Dining",
        "image": "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=kitchen%20and%20dining"
      },
      {
        "label": "Smart Home",
        "image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&auto=format&fit=crop&q=85",
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
        "label": "Jewelry",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=jewelry"
      },
      {
        "label": "Handbags",
        "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=handbags"
      },
      {
        "label": "Footwear",
        "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=women%20footwear"
      },
      {
        "label": "Beauty",
        "image": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=85",
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
        "label": "Hair Care",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=hair%20care"
      },
      {
        "label": "Fragrances",
        "image": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=fragrances"
      },
      {
        "label": "Make-up",
        "image": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Make%20up"
      },
      {
        "label": "Skin Care",
        "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=85",
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
        "label": "Laptops",
        "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=laptops"
      },
      {
        "label": "PCs",
        "image": "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=desktop%20PCs"
      },
      {
        "label": "Hard Drives",
        "image": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=hard%20drives"
      },
      {
        "label": "Monitors",
        "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=85",
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
        "label": "Women's",
        "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=WOmen%20Shoes"
      },
      {
        "label": "Men's",
        "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Men%20Shoes"
      },
      {
        "label": "Kids'",
        "image": "https://images.unsplash.com/photo-1471286174890-9c112ffca56a?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Kid%20Shoes"
      },
      {
        "label": "All shoes",
        "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&auto=format&fit=crop&q=85",
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
        "label": "Kitchen essentials",
        "image": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=kitchen%20essentials"
      },
      {
        "label": "Home comfort",
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=home%20sofa%20living%20room"
      },
      {
        "label": "Decorate with elegance",
        "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=home%20decor"
      },
      {
        "label": "Light it Right",
        "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=85",
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
        "label": "Women's",
        "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=women%20footwear"
      },
      {
        "label": "Men's",
        "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=men%20footwear"
      },
      {
        "label": "Girl's",
        "image": "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=girls%20footwear"
      },
      {
        "label": "Boy's",
        "image": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&auto=format&fit=crop&q=85",
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
        "label": "Dogs",
        "image": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=pet%20dog%20supplies"
      },
      {
        "label": "Cats",
        "image": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=pet%20cat%20supplies"
      },
      {
        "label": "Small Pets",
        "image": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=small%20pet%20supplies"
      },
      {
        "label": "Deals",
        "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=85",
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
        "label": "Xbox controllers",
        "image": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=xbox%20controller"
      },
      {
        "label": "Nintendo",
        "image": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Nintendo"
      },
      {
        "label": "VR headsets",
        "image": "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=vr%20headset"
      },
      {
        "label": "PS5 accessories",
        "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=85",
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
        "label": "Outdoor Play Sets",
        "image": "https://images.unsplash.com/photo-1533230808584-3d094016fb77?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=outdoor%20play%20toys"
      },
      {
        "label": "Learning Toys",
        "image": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=learning%20toys"
      },
      {
        "label": "Action Figures",
        "image": "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=action%20figures"
      },
      {
        "label": "Pretend Play Toys",
        "image": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=85",
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
        "label": "Bedsheets",
        "image": "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Bedsheets"
      },
      {
        "label": "Pillows",
        "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Pillows"
      },
      {
        "label": "Duvet Covers",
        "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=duvet%20covers"
      },
      {
        "label": "Throws",
        "image": "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&auto=format&fit=crop&q=85",
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
        "label": "Books",
        "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Books"
      },
      {
        "label": "Fashion",
        "image": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Fashion"
      },
      {
        "label": "PCPC",
        "image": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=PCPC"
      },
      {
        "label": "Beauty",
        "image": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=85",
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
        "label": "Kitchen & dining",
        "image": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=kitchen%20and%20dining"
      },
      {
        "label": "Home improvement",
        "image": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=home%20improvement"
      },
      {
        "label": "D\u00e9cor",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=home%20decor"
      },
      {
        "label": "Bedding & bath",
        "image": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=85",
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
        "label": "Electronics",
        "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=electronics"
      },
      {
        "label": "Home",
        "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=home"
      },
      {
        "label": "Beauty",
        "image": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=beauty"
      },
      {
        "label": "Fashion",
        "image": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&auto=format&fit=crop&q=85",
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
        "label": "Fashion accessories",
        "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=fashion%20accessories"
      },
      {
        "label": "Men's accessories",
        "image": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=men%20accessories"
      },
      {
        "label": "Health and beauty",
        "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=health%20and%20beauty"
      },
      {
        "label": "Sports",
        "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=85",
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
        "label": "Women's clothing",
        "image": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=women%20apparel"
      },
      {
        "label": "Women's shoes",
        "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Women%20shoes"
      },
      {
        "label": "Men's clothing",
        "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Men%20apparel"
      },
      {
        "label": "Men's shoes",
        "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=85",
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
        "label": "Makeup",
        "image": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=makeup"
      },
      {
        "label": "Brushes",
        "image": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=makeup%20brushes"
      },
      {
        "label": "Sponges",
        "image": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=makeup%20sponge"
      },
      {
        "label": "Mirrors",
        "image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=85",
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
        "label": "Televisions",
        "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=television"
      },
      {
        "label": "Speakers",
        "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=speakers"
      },
      {
        "label": "Soundbars",
        "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=soundbars"
      },
      {
        "label": "Projectors",
        "image": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=85",
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
        "label": "Candles",
        "image": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Candles"
      },
      {
        "label": "Stylish pillows",
        "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=stylish%20pillows"
      },
      {
        "label": "Indoor gardening",
        "image": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=indoor%20gardening"
      },
      {
        "label": "Storage organization",
        "image": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=85",
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
        "label": "For Her",
        "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=woman%20apparel"
      },
      {
        "label": "For Him",
        "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=men%20apparel"
      },
      {
        "label": "For Teens",
        "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=teen%20apparel"
      },
      {
        "label": "For Kids",
        "image": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&auto=format&fit=crop&q=85",
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
        "label": "Processors",
        "image": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=processors"
      },
      {
        "label": "Motherboards",
        "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=motherboards"
      },
      {
        "label": "Power Supplies",
        "image": "https://images.unsplash.com/photo-1588797303982-f013d288d752?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=power%20supply%20pc"
      },
      {
        "label": "Cooling",
        "image": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=85",
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
        "label": "Children's",
        "image": "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=childrens%20books"
      },
      {
        "label": "Mystery",
        "image": "https://images.unsplash.com/photo-1509021436665-8f07dbf76c61?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Mystery%20books"
      },
      {
        "label": "Fiction",
        "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=Fiction%20books"
      },
      {
        "label": "Motivational books",
        "image": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=85",
        "url": "/s?k=motivational%20books"
      }
    ],
    "ctaText": "See more",
    "ctaUrl": "/s?k=Books you can't put down"
  }
];
