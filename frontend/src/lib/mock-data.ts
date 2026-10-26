export interface Product {
  id: string;
  name: string;
  price: string;
  priceRaw: number;
  category: string;
  stock: number;
  image: string;
  tagline: string;
  features: string[];
  discount?: string;
}

export interface SocialPostState {
  id: string;
  productId: string;
  headline: string;
  caption: string;
  hashtags: string[];
  cta: string;
  postType: 'PRODUCT_SHOWCASE' | 'OFFER' | 'ENGAGEMENT' | 'STORY';
  status: 'DRAFT' | 'READY' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED';
  platform: 'META_FACEBOOK' | 'INSTAGRAM';
  scheduledTime?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  image: string;
  tone: 'natural' | 'witty' | 'promo' | 'storytelling';
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Nightfall Urban Techwear Jacket',
    price: '৳7,200',
    priceRaw: 7200,
    category: 'Jackets',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    tagline: 'Water-resistant, insulated street bomber with magnetic tech utility pockets.',
    features: ['Water-Resistant Cordura', 'Thermal Micro-Fleece', 'Windproof Shell'],
    discount: '15% OFF',
  },
  {
    id: 'prod-2',
    name: 'AeroVelocity Retro Street Sneakers',
    price: '৳9,800',
    priceRaw: 9800,
    category: 'Footwear',
    stock: 7,
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    tagline: 'Dual-density foam cushioning with handcrafted leather trims.',
    features: ['CloudAir Sole', 'Full-Grain Leather', 'Reflective Accents'],
    discount: 'Limited Drop',
  },
  {
    id: 'prod-3',
    name: 'Cyberpunk Heavyweight Oversized Hoodie',
    price: '৳4,950',
    priceRaw: 4950,
    category: 'Hoodies',
    stock: 32,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    tagline: '500 GSM French Terry cotton with vintage wash and cyber typography.',
    features: ['500 GSM Heavyweight', 'Pre-Shrunk Organic Cotton', 'Double-Lined Hood'],
  },
  {
    id: 'prod-4',
    name: 'Nomad Minimalist Daily Sling Bag',
    price: '৳3,850',
    priceRaw: 3850,
    category: 'Accessories',
    stock: 14,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    tagline: 'Weatherproof cross-body pack with quick-release magnetic buckle.',
    features: ['Weatherproof Ballistic Nylon', 'FIDLOCK Magnetic Buckle', 'Internal Organizers'],
  },
];

export const MOCK_POST_VARIATIONS: Record<string, Record<string, { caption: string; hashtags: string[]; cta: string }>> = {
  'prod-1': {
    natural: {
      caption: 'Just dropped! 🔥 Our Nightfall Techwear Jacket is built for those who never let the weather slow them down. Water-resistant, insulated, and crafted for the city streets. Limited batch available in all sizes.',
      hashtags: ['#UrbanTechwear', '#DhakaStreetwear', '#WinterDrop', '#NightfallJacket', '#PostMind'],
      cta: 'Shop Now — Free Nationwide Shipping',
    },
    witty: {
      caption: "Weather forecast: 100% chance of you looking twice as cool. 🌧️⚡ Stop shivering in that 5-year-old hoodie and upgrade your drip with the Nightfall Bomber before your size sells out again.",
      hashtags: ['#DripCheck', '#TechwearDaily', '#StayWarmStayFly', '#DhakaFashion'],
      cta: 'Claim Yours Before Your Friends Do',
    },
    promo: {
      caption: '🚨 FLASH SALE: Get 20% OFF the Nightfall Urban Techwear Jacket with code NIGHT20! 🏷️ Premium weatherproof build, thermal micro-fleece, and ergonomic pockets. Offer expires midnight!',
      hashtags: ['#FlashSaleBD', '#DiscountAlert', '#TechwearStyle', '#UrbanWearDhaka'],
      cta: 'Use Code NIGHT20 at Checkout',
    },
    storytelling: {
      caption: 'When we designed the Nightfall series, we had one goal: blend tactical outdoor durability with effortless street silhouette. 6 months of fabric testing led us to this high-density weave that breathes while blocking winter winds. 🧥✨',
      hashtags: ['#BehindTheDesign', '#CraftedInBD', '#StreetwearCulture', '#QualityFirst'],
      cta: 'Discover the Craftsmanship',
    },
  },
  'prod-2': {
    natural: {
      caption: 'Step up your rotation. 👟 The AeroVelocity Retro Sneakers combine nostalgic 90s court heritage with modern CloudAir cushioning for all-day comfort. Only 7 pairs remaining.',
      hashtags: ['#AeroVelocity', '#SneakerheadBD', '#FreshKicks', '#StreetwearDhaka'],
      cta: 'Order Now — Cash on Delivery Available',
    },
    witty: {
      caption: "Your feet called — they said they're tired of stiff shoes. 🦶 Treat them to the AeroVelocity Retro Sneakers. You'll literally feel like walking on clouds.",
      hashtags: ['#KickGameStrong', '#DailyComfort', '#SneakerAddict'],
      cta: 'Upgrade Your Stride Today',
    },
    promo: {
      caption: '⚡ SPECIAL WEEKEND DROP: Free matching streetwear socks + ৳500 voucher on every AeroVelocity Retro Sneaker order! Valid this weekend only.',
      hashtags: ['#WeekendOffer', '#SneakerDeals', '#UrbanWearBD'],
      cta: 'Grab the Weekend Bundle',
    },
    storytelling: {
      caption: 'Every pair of AeroVelocity sneakers goes through 42 individual assembly checkpoints. From the hand-stitched leather panels to the responsive rebound soles, perfection is in the details. 👟🔥',
      hashtags: ['#ShoeMaking', '#HeritageDesign', '#UrbanWearOfficial'],
      cta: 'Explore The Collection',
    },
  },
  'prod-3': {
    natural: {
      caption: 'Unmatched comfort, heavyweight drape. The Cyberpunk Oversized Hoodie is made from ultra-dense 500 GSM French Terry cotton for the ultimate relaxed streetwear fit.',
      hashtags: ['#HeavyweightHoodie', '#OversizedFit', '#StreetwearEssentials'],
      cta: 'Shop the Drop',
    },
    witty: {
      caption: "Warning: Once you put this 500 GSM hoodie on, you won't want to take it off all winter. Don't say we didn't warn you. 🥶☁️",
      hashtags: ['#CozyVibes', '#HoodieSeason', '#DhakaWinter'],
      cta: 'Get Cozy Now',
    },
    promo: {
      caption: '🔥 BUY 2 & GET 15% OFF across all Cyberpunk Heavyweight Hoodies! Mix and match colors with your squad. Discount auto-applied at checkout.',
      hashtags: ['#BundleDeal', '#HoodieSale', '#WinterOutfit'],
      cta: 'Shop Hoodie Bundles',
    },
    storytelling: {
      caption: 'We custom-milled this 500 GSM cotton to ensure it never loses its boxy structure, even after 50 washes. Real heavyweight feel, designed for real life.',
      hashtags: ['#CustomFabrics', '#BuiltToLast', '#UrbanWearDhaka'],
      cta: 'Read Fabric Details',
    },
  },
  'prod-4': {
    natural: {
      caption: 'Keep your everyday essentials organized, dry, and right at your fingertips. The Nomad Daily Sling features weatherproof ballistic nylon and quick-release magnetic hardware.',
      hashtags: ['#DailyCarry', '#EDCSling', '#NomadPack', '#MinimalistGear'],
      cta: 'Order Now',
    },
    witty: {
      caption: "Pockets looking like you're carrying two bricks? 🧱 Level up to the Nomad Sling Bag and keep your phone, keys, and wallet sleekly packed without the pocket bulge.",
      hashtags: ['#EDCGear', '#SlingBagLife', '#StayOrganized'],
      cta: 'Declutter Your Pockets',
    },
    promo: {
      caption: '🎒 FLASH PROMO: Nomad Minimalist Daily Sling Bag now at ৳3,850 (Regular ৳4,500). Includes free water-resistant tech pouch for the first 20 orders!',
      hashtags: ['#EDCDeal', '#SlingBagPromo', '#UrbanGear'],
      cta: 'Claim Limited Promo',
    },
    storytelling: {
      caption: 'Designed for commuters, photographers, and city explorers. The Nomad Sling was tested on 500+ miles of urban biking to ensure ergonomic weight distribution.',
      hashtags: ['#DesignedForMovement', '#CityCommuter', '#NomadLife'],
      cta: 'See All Features',
    },
  },
};
