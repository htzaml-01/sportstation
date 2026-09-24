/**
 * SPORTS STATION - SHOP CATALOG SCRIPT (shop.js)
 * Manages Dynamic URL Parameters, Filters, Live Search, and Cart Interactions
 */

// ============================================================================
// 1. COMPREHENSIVE PRODUCT DATASET
// ============================================================================
const DEFAULT_PRODUCTS = [
  // --- 1. NIKE ---
  {
    id: 'nike-pegasus-plus',
    name: "Nike Pegasus Plus Men's Road Running Shoes",
    brand: 'nike',
    gender: 'men',
    category: 'running',
    price: 2499000,
    originalPrice: 2499000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif'
  },
  {
    id: 'nike-zoom-fly-6',
    name: "Nike Zoom Fly 6 Men's Road Racing Shoes",
    brand: 'nike',
    gender: 'men',
    category: 'running',
    price: 2699000,
    originalPrice: 2699000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif'
  },
  {
    id: 'nike-vomero-plus-cm',
    name: "Nike Vomero Plus Men's Running Shoes - Obsidian",
    brand: 'nike',
    gender: 'men',
    category: 'running',
    price: 1149500,
    originalPrice: 2299000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS+CM.avif'
  },
  {
    id: 'nike-structure-plus',
    name: "Nike Structure Plus Men's Road Running Shoes - Platinum",
    brand: 'nike',
    gender: 'men',
    category: 'running',
    price: 974500,
    originalPrice: 1949000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif'
  },
  {
    id: 'nike-alphafly-4',
    name: "Nike Alphafly 4 Men's Marathon Racing Shoes",
    brand: 'nike',
    gender: 'men',
    category: 'running',
    price: 4099000,
    originalPrice: 4099000,
    discount: 0,
    isSale: false,
    tag: 'LIMITED',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/Alphafly4.avif'
  },
  {
    id: 'nike-w-pegasus-42',
    name: "W Nike Air Zoom Pegasus 42 Women's Running Shoes",
    brand: 'nike',
    gender: 'women',
    category: 'running',
    price: 2099000,
    originalPrice: 2099000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif'
  },
  {
    id: 'nike-w-pegasus-easyon',
    name: "W Pegasus 42 EasyOn Women's Running Shoes",
    brand: 'nike',
    gender: 'women',
    category: 'running',
    price: 1049500,
    originalPrice: 2099000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif'
  },
  {
    id: 'nike-w-vomero-18',
    name: "W Nike Vomero 18 Women's Road Running Shoes",
    brand: 'nike',
    gender: 'women',
    category: 'running',
    price: 2299000,
    originalPrice: 2299000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif'
  },
  {
    id: 'nike-court-vision-low',
    name: "Nike Court Vision Low Men's Sneakers",
    brand: 'nike',
    gender: 'men',
    category: 'lifestyle',
    price: 719400,
    originalPrice: 1199000,
    discount: 40,
    isSale: true,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif'
  },
  {
    id: 'jordan-stay-loyal-3',
    name: "Jordan Stay Loyal 3 Men's Basketball Shoes",
    brand: 'nike',
    gender: 'men',
    category: 'basketball',
    price: 1799000,
    originalPrice: 1799000,
    discount: 0,
    isSale: false,
    tag: 'HOT',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif'
  },
  {
    id: 'nike-pro-sports-bra',
    name: "Nike Pro Dri-FIT Women's Medium-Support Sports Bra",
    brand: 'nike',
    gender: 'women',
    category: 'sports-bra',
    price: 499000,
    originalPrice: 499000,
    discount: 0,
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'nike-dri-fit-challenger-shorts',
    name: "Nike Dri-FIT Challenger Men's 7\" Running Shorts",
    brand: 'nike',
    gender: 'men',
    category: 'shorts',
    price: 429000,
    originalPrice: 429000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'nike-club-fleece-jacket',
    name: "Nike Sportswear Club Fleece Full-Zip Jacket",
    brand: 'nike',
    gender: 'men',
    category: 'jacket',
    price: 849000,
    originalPrice: 849000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'nike-heritage-backpack',
    name: "Nike Heritage Eugene Sport Backpack (23L)",
    brand: 'nike',
    gender: 'unisex',
    category: 'bags',
    price: 499000,
    originalPrice: 499000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'nike-everyday-socks-3pack',
    name: "Nike Everyday Cushion Ankle Socks (3-Pack)",
    brand: 'nike',
    gender: 'unisex',
    category: 'socks',
    price: 199000,
    originalPrice: 199000,
    discount: 0,
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },

  // --- 2. SKECHERS ---
  {
    id: 'skechers-arya-womens',
    name: "Skechers Arya Women's Slip-On Shoes",
    brand: 'skechers',
    gender: 'women',
    category: 'lifestyle',
    price: 649500,
    originalPrice: 1299000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif'
  },
  {
    id: 'skechers-ultra-flex-sandal',
    name: "Skechers Ultra Flex 3.0 Women's Comfort Sandals",
    brand: 'skechers',
    gender: 'women',
    category: 'sandals',
    price: 429500,
    originalPrice: 859000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif'
  },
  {
    id: 'skechers-bobs-squad-waves',
    name: "Skechers Bobs Squad Waves Women's Sneakers - Taupe",
    brand: 'skechers',
    gender: 'women',
    category: 'lifestyle',
    price: 687200,
    originalPrice: 859000,
    discount: 20,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif'
  },
  {
    id: 'skechers-gowalk-max-men',
    name: "Skechers GOwalk Max Men's Athletic Walking Shoes",
    brand: 'skechers',
    gender: 'men',
    category: 'lifestyle',
    price: 899000,
    originalPrice: 899000,
    discount: 0,
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif'
  },
  {
    id: 'skechers-dynamatic-girls',
    name: "Skechers Dynamatic Girl's Road Running Shoes",
    brand: 'skechers',
    gender: 'kids',
    category: 'running',
    price: 399000,
    originalPrice: 399000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif'
  },
  {
    id: 'skechers-backpack-unisex',
    name: "Skechers Sport Unisex Daily Backpack (20L)",
    brand: 'skechers',
    gender: 'unisex',
    category: 'bags',
    price: 399000,
    originalPrice: 399000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'skechers-lowcut-socks-3pk',
    name: "Skechers Men 3-Pack Low Cut Performance Socks",
    brand: 'skechers',
    gender: 'men',
    category: 'socks',
    price: 79000,
    originalPrice: 79000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },

  // --- 3. ADIDAS ---
  {
    id: 'adidas-treadmove-men',
    name: "Adidas Treadmove Men's Road Running Shoes",
    brand: 'adidas',
    gender: 'men',
    category: 'running',
    price: 325000,
    originalPrice: 650000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif'
  },
  {
    id: 'adidas-switch-move-men',
    name: "Adidas Switch Move Men's Running Shoes - Core Black",
    brand: 'adidas',
    gender: 'men',
    category: 'running',
    price: 390000,
    originalPrice: 650000,
    discount: 40,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif'
  },
  {
    id: 'adidas-runfalcon-5-womens',
    name: "Adidas Runfalcon 5 Women's Running Shoes - Black",
    brand: 'adidas',
    gender: 'women',
    category: 'running',
    price: 490000,
    originalPrice: 700000,
    discount: 30,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif'
  },
  {
    id: 'adidas-tiro-24-pants',
    name: "Adidas Tiro 24 Track Pants (Celana Training)",
    brand: 'adidas',
    gender: 'unisex',
    category: 'pants',
    price: 699000,
    originalPrice: 699000,
    discount: 0,
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'adidas-essentials-3s-tee',
    name: "Adidas Essentials 3-Stripes Tee Men's",
    brand: 'adidas',
    gender: 'men',
    category: 'tshirt',
    price: 349000,
    originalPrice: 349000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },

  // --- 4. PUMA ---
  {
    id: 'puma-interflex-modern',
    name: "Puma INTERFLEX Modern Men's Running Shoes",
    brand: 'puma',
    gender: 'men',
    category: 'running',
    price: 299500,
    originalPrice: 599000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif'
  },
  {
    id: 'puma-softride-clean-v2',
    name: "Puma Softride Clean V2 Men's Cushion Running Shoes",
    brand: 'puma',
    gender: 'men',
    category: 'running',
    price: 349500,
    originalPrice: 699000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif'
  },
  {
    id: 'puma-flyer-lite-3',
    name: "Puma Flyer Lite 3 Men's Performance Running Shoes",
    brand: 'puma',
    gender: 'men',
    category: 'running',
    price: 479400,
    originalPrice: 799000,
    discount: 40,
    isSale: true,
    tag: 'HOT',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif'
  },
  {
    id: 'puma-classic-logo-tee',
    name: "Puma Classics Men's Sport Logo T-Shirt",
    brand: 'puma',
    gender: 'men',
    category: 'tshirt',
    price: 299000,
    originalPrice: 349000,
    discount: 14,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'puma-tr-sport-bottle',
    name: "Puma Sport Training Water Bottle (750ml)",
    brand: 'puma',
    gender: 'unisex',
    category: 'bottles',
    price: 159000,
    originalPrice: 159000,
    discount: 0,
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },

  // --- 5. NEW BALANCE ---
  {
    id: 'nb-460-v4-men',
    name: "New Balance 460 v4 Men's Road Running Shoes",
    brand: 'new-balance',
    gender: 'men',
    category: 'running',
    price: 549500,
    originalPrice: 1099000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif'
  },
  {
    id: 'nb-411-v4-women',
    name: "New Balance 411v4 Women's Running Shoes - Grey",
    brand: 'new-balance',
    gender: 'women',
    category: 'running',
    price: 719200,
    originalPrice: 899000,
    discount: 20,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif'
  },
  {
    id: 'nb-tektrel-trail',
    name: "New Balance Tektrel Trail Men's Outdoor Running Shoes",
    brand: 'new-balance',
    gender: 'men',
    category: 'running',
    price: 749500,
    originalPrice: 1499000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif'
  },

  // --- 6. REEBOK ---
  {
    id: 'reebok-zig-dynamica-6',
    name: "Reebok Zig Dynamica 6 Men's Performance Running Shoes",
    brand: 'reebok',
    gender: 'men',
    category: 'running',
    price: 649500,
    originalPrice: 1299000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Reebok-Pulse-Core.png'
  },
  {
    id: 'reebok-mundo-men',
    name: "Reebok Mundo Men's Road Running Shoes",
    brand: 'reebok',
    gender: 'men',
    category: 'running',
    price: 399500,
    originalPrice: 799000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Reebok-Pulse-Core.png'
  },
  {
    id: 'reebok-court-advance-vulc',
    name: "Reebok Court Advance Vulc Men's Classic Sneakers",
    brand: 'reebok',
    gender: 'men',
    category: 'lifestyle',
    price: 419300,
    originalPrice: 599000,
    discount: 30,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Reebok-Pulse-Core.png'
  },

  // --- 7. CONVERSE ---
  {
    id: 'converse-day-one-platform',
    name: "Converse Day One Platform Women's Lifestyle Sneakers",
    brand: 'converse',
    gender: 'women',
    category: 'lifestyle',
    price: 379500,
    originalPrice: 759000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif'
  },
  {
    id: 'converse-day-one-court',
    name: "Converse Day One Court Unisex Sneakers",
    brand: 'converse',
    gender: 'unisex',
    category: 'lifestyle',
    price: 299500,
    originalPrice: 599000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif'
  },
  {
    id: 'converse-kids-go-bag',
    name: "Converse Kids Go Boy's Sport Backpack",
    brand: 'converse',
    gender: 'kids',
    category: 'bags',
    price: 249500,
    originalPrice: 499000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },

  // --- 8. DIADORA ---
  {
    id: 'diadora-rayna-men',
    name: "Diadora Rayna Men's Road Running Shoes",
    brand: 'diadora',
    gender: 'men',
    category: 'running',
    price: 249500,
    originalPrice: 499000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif'
  },
  {
    id: 'diadora-niles-2-men',
    name: "Diadora Niles 2 Men's Running Shoes - Dark Navy",
    brand: 'diadora',
    gender: 'men',
    category: 'running',
    price: 399500,
    originalPrice: 799000,
    discount: 50,
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif'
  },
  {
    id: 'diadora-spinta-men',
    name: "Diadora Spinta Performance Men's Athletic Shoes",
    brand: 'diadora',
    gender: 'men',
    category: 'running',
    price: 447200,
    originalPrice: 559000,
    discount: 20,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS+CM.avif'
  },

  // --- 9. ASTEC ---
  {
    id: 'astec-nuclear-womens',
    name: "Astec Nuclear Women's Badminton Shoes - White",
    brand: 'astec',
    gender: 'women',
    category: 'badminton',
    price: 479400,
    originalPrice: 799000,
    discount: 40,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif'
  },
  {
    id: 'astec-mythos-womens',
    name: "Astec Mythos Women's Badminton Shoes - Sky Blue",
    brand: 'astec',
    gender: 'women',
    category: 'badminton',
    price: 607200,
    originalPrice: 759000,
    discount: 20,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif'
  },
  {
    id: 'astec-nero-men',
    name: "Astec Nero Men's Court Badminton Shoes",
    brand: 'astec',
    gender: 'men',
    category: 'badminton',
    price: 479200,
    originalPrice: 599000,
    discount: 20,
    isSale: true,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif'
  },

  // --- 10. AIRWALK ---
  {
    id: 'airwalk-galaxy-men',
    name: "Airwalk Galaxy Men's Skateboard Lifestyle Shoes",
    brand: 'airwalk',
    gender: 'men',
    category: 'lifestyle',
    price: 391300,
    originalPrice: 559000,
    discount: 30,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif'
  },
  {
    id: 'airwalk-legian-sandals',
    name: "Airwalk Legian Men's Casual Comfort Sandals",
    brand: 'airwalk',
    gender: 'men',
    category: 'sandals',
    price: 229000,
    originalPrice: 329000,
    discount: 30,
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif'
  },

  // --- 11. EQUIPMENT & GEAR (SPALDING, PRINCE, GILDAN) ---
  {
    id: 'spalding-tf-150-ball',
    name: "Spalding TF-150 Outdoor Rubber Basketball (Size 7)",
    brand: 'spalding',
    gender: 'unisex',
    category: 'basketball',
    price: 359000,
    originalPrice: 359000,
    discount: 0,
    stock: 30,
    sizeStock: { 'All Size': 30 },
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'prince-tour-team-bag',
    name: "Prince Tour Team 6 Pack Performance Tennis Bag",
    brand: 'prince',
    gender: 'unisex',
    category: 'bags',
    price: 719200,
    originalPrice: 899000,
    discount: 20,
    stock: 15,
    sizeStock: { 'All Size': 15 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'gildan-softstyle-tee',
    name: "Gildan Softstyle Unisex Sport T-Shirt",
    brand: 'gildan',
    gender: 'unisex',
    category: 'tshirt',
    price: 79000,
    originalPrice: 79000,
    discount: 0,
    stock: 50,
    sizeStock: { 'S': 10, 'M': 20, 'L': 15, 'XL': 5 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  }
];

// Load catalog products from localStorage (shared with Admin Panel)
function loadMergedProducts() {
  let products = [];
  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products = parsed;
      }
    }
  } catch (e) {}

  if (products.length === 0) {
    products = [...DEFAULT_PRODUCTS];
  } else {
    // Merge any missing authentic items from DEFAULT_PRODUCTS
    DEFAULT_PRODUCTS.forEach(dp => {
      if (!products.some(p => p.id === dp.id)) {
        products.push({ ...dp });
      }
    });
  }

  localStorage.setItem('SportsStationCatalog', JSON.stringify(products));
  return products;
}

const PRODUCTS = loadMergedProducts();

// Shoe Sizes Available
const MEN_SHOE_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45'];
const WOMEN_SHOE_SIZES = ['36', '37', '38', '39', '40', '41'];
const KIDS_SHOE_SIZES = ['30', '31', '32', '33', '34', '35'];
const ALL_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

PRODUCTS.forEach(p => {
  if (!p.sizeStock || typeof p.sizeStock !== 'object' || Object.keys(p.sizeStock).length === 0) {
    p.sizeStock = {};
    const cat = (p.category || '').toLowerCase();
    const isApparel = ['tshirt', 'shorts', 'pants', 'sports-bra', 'jacket', 'tanktop', 'swimming'].includes(cat);
    const isAccessory = ['bags', 'caps', 'socks', 'bottles', 'equipment'].includes(cat);

    if (isApparel) {
      ['S', 'M', 'L', 'XL'].forEach(sz => { p.sizeStock[sz] = 8; });
    } else if (isAccessory) {
      p.sizeStock['All Size'] = 15;
    } else {
      (p.gender === 'women' ? WOMEN_SHOE_SIZES : MEN_SHOE_SIZES).forEach(sz => { p.sizeStock[sz] = 6; });
    }
  }

  p.sizes = Object.keys(p.sizeStock);
  p.stock = Object.values(p.sizeStock).reduce((sum, qty) => sum + Number(qty || 0), 0);
});

// Format Currency
function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function getMaxCatalogPrice() {
  const max = PRODUCTS.reduce((m, p) => Math.max(m, Number(p.price || 0)), 4000000);
  return Math.max(max, 4000000);
}

// Track if price slider was actively touched by user
let isPriceSliderTouched = false;

// ============================================================================
// 2. STATE & FILTER MANAGEMENT
// ============================================================================
const state = {
  selectedGenders: new Set(),
  selectedCategories: new Set(),
  selectedBrands: new Set(),
  selectedSizes: new Set(),
  maxPrice: 4000000,
  minPrice: 15000,
  sortBy: 'relevance',
  saleOnly: false,
  brandSearchQuery: ''
};

document.addEventListener('DOMContentLoaded', () => {
  initUrlParams();
  renderFilterOptions();
  initFilterDomListeners();
  initHeaderAndScrollTop();
  initMegaDropdowns();
  renderProducts();

  if (window.SportsStationDB && window.SportsStationDB.isConfigured()) {
    window.SportsStationDB.fetchProducts().then(prods => {
      if (prods && prods.length > 0) {
        PRODUCTS.length = 0;
        prods.forEach(p => PRODUCTS.push(p));
        renderProducts();
      }
    }).catch(e => console.warn('Gagal sync produk dari Supabase di shop:', e));
  }
});

// ============================================================================
// 3. PARSE URL PARAMETERS (AUTO-CHECK FILTERS)
// ============================================================================
function initUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);

  // 1. Sport / Category parameter
  const sportParam = urlParams.get('sport') || urlParams.get('category');
  if (sportParam) {
    const sportLower = sportParam.toLowerCase().trim();
    state.selectedCategories.add(sportLower);
  }

  // 2. Gender parameter (men, women, kids, unisex)
  const genderParam = urlParams.get('gender');
  if (genderParam) {
    const genderLower = genderParam.toLowerCase().trim();
    const normGender = genderLower === 'male' ? 'men' : (genderLower === 'female' ? 'women' : genderLower);
    state.selectedGenders.add(normGender);
  }

  // 3. Brand parameter
  const brandParam = urlParams.get('brand');
  if (brandParam) {
    const brandLower = brandParam.toLowerCase().trim();
    state.selectedBrands.add(brandLower);
  }

  // 4. Sale parameter
  if (urlParams.get('sale') === 'true' || urlParams.get('sale') === '1') {
    state.saleOnly = true;
  }

  // 5. Shoe Size parameter (e.g. ?size=US 6.5, ?size=6.5, ?size=US+6.5)
  const sizeParam = urlParams.get('size');
  if (sizeParam) {
    let s = decodeURIComponent(sizeParam).trim().toUpperCase();
    if (!s.startsWith('US') && !isNaN(parseFloat(s))) {
      s = 'US ' + s;
    }
    if (s.startsWith('US') && s.length > 2 && s[2] !== ' ') {
      s = 'US ' + s.slice(2).trim();
    }
    state.selectedSizes.add(s);
  }

  updatePageTitle();
}

function updatePageTitle() {
  const titleEl = document.getElementById('shopTitle');
  if (!titleEl) return;

  const parts = [];
  if (state.selectedGenders.size > 0) {
    const genders = Array.from(state.selectedGenders).map(g => g.charAt(0).toUpperCase() + g.slice(1));
    parts.push(genders.join(', '));
  } else if (state.selectedCategories.size > 0) {
    parts.push('Sports');
  }

  if (state.selectedCategories.size > 0) {
    const cats = Array.from(state.selectedCategories).map(c => c.charAt(0).toUpperCase() + c.slice(1));
    parts.push(cats.join(', '));
  }

  if (state.selectedBrands.size > 0) {
    const brands = Array.from(state.selectedBrands).map(b => b.toUpperCase());
    parts.push(brands.join(', '));
  }

  if (state.selectedSizes.size > 0) {
    parts.push(`Size ${Array.from(state.selectedSizes).join(', ')}`);
  }

  if (state.saleOnly) {
    parts.push('Sale');
  }

  if (parts.length === 0) {
    titleEl.textContent = 'Shop / All Products';
  } else {
    titleEl.textContent = parts.join(' / ');
  }
}

// ============================================================================
// 4. DYNAMIC FILTER OPTIONS RENDERING (ONLY EXISTING ITEMS)
// ============================================================================
function renderFilterOptions() {
  const genderCounts = {};
  const categoryCounts = {};
  const brandCounts = {};

  PRODUCTS.forEach(p => {
    genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1;
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  });

  // Render Gender Options (only if count > 0)
  const genderContainer = document.querySelector('#filterGenderGroup .filter-options-list');
  if (genderContainer) {
    const genders = [
      { id: 'men', name: 'Men' },
      { id: 'women', name: 'Women' },
      { id: 'unisex', name: 'Unisex' },
      { id: 'kids', name: 'Kids' }
    ];
    genderContainer.innerHTML = genders
      .filter(g => genderCounts[g.id] > 0)
      .map(g => `
        <label class="filter-checkbox-label">
          <div class="checkbox-left">
            <input type="checkbox" name="gender" value="${g.id}" ${state.selectedGenders.has(g.id) ? 'checked' : ''}>
            <span>${g.name}</span>
          </div>
          <span class="filter-count">(${genderCounts[g.id]})</span>
        </label>
      `).join('');
  }

  // Render Category Options (only if count > 0)
  const catContainer = document.querySelector('#filterCategoryGroup .filter-options-list');
  if (catContainer) {
    const knownCategories = [
      // Footwear
      { id: 'running', name: 'Running' },
      { id: 'sneakers', name: 'Lifestyle & Sneakers' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'football', name: 'Football & Futsal' },
      { id: 'training', name: 'Training & Gym' },
      { id: 'badminton', name: 'Badminton' },
      { id: 'tennis', name: 'Tennis' },
      { id: 'sandals', name: 'Sandals & Slides' },
      { id: 'walking', name: 'Walking' },
      { id: 'fitness', name: 'Fitness' },
      // Apparel
      { id: 'tshirt', name: 'T-Shirt & Jersey' },
      { id: 'shorts', name: 'Celana Pendek' },
      { id: 'pants', name: 'Celana Panjang & Jogger' },
      { id: 'sports-bra', name: 'Sports Bra' },
      { id: 'jacket', name: 'Jaket & Hoodie' },
      { id: 'tanktop', name: 'Tank Top & Singlet' },
      { id: 'swimming', name: 'Swimwear & Renang' },
      // Accessories
      { id: 'bags', name: 'Tas & Ransel' },
      { id: 'caps', name: 'Topi & Headwear' },
      { id: 'socks', name: 'Kaos Kaki' },
      { id: 'bottles', name: 'Botol Minum' },
      { id: 'equipment', name: 'Perlengkapan Olahraga & Deker' }
    ];

    const catMap = new Map();
    knownCategories.forEach(c => catMap.set(c.id, c.name));
    Object.keys(categoryCounts).forEach(catId => {
      if (!catMap.has(catId)) {
        catMap.set(catId, catId.charAt(0).toUpperCase() + catId.slice(1));
      }
    });

    const categories = Array.from(catMap.entries()).map(([id, name]) => ({ id, name }));

    catContainer.innerHTML = categories
      .filter(c => categoryCounts[c.id] > 0)
      .map(c => `
        <label class="filter-checkbox-label">
          <div class="checkbox-left">
            <input type="checkbox" name="category" value="${c.id}" ${state.selectedCategories.has(c.id) ? 'checked' : ''}>
            <span>${c.name}</span>
          </div>
          <span class="filter-count">(${categoryCounts[c.id]})</span>
        </label>
      `).join('');
  }

  // Render Brand Options (only if count > 0)
  const brandContainer = document.getElementById('brandOptionsList');
  if (brandContainer) {
    const brands = [
      { id: 'nike', name: 'Nike' },
      { id: 'diadora', name: 'Diadora' },
      { id: 'adidas', name: 'Adidas' },
      { id: 'astec', name: 'Astec' },
      { id: 'reebok', name: 'Reebok' },
      { id: 'puma', name: 'Puma' },
      { id: 'skechers', name: 'Skechers' },
      { id: 'converse', name: 'Converse' },
      { id: 'airwalk', name: 'Airwalk' },
      { id: 'spalding', name: 'Spalding' },
      { id: 'prince', name: 'Prince' },
      { id: 'speedo', name: 'Speedo' }
    ];
    brandContainer.innerHTML = brands
      .filter(b => brandCounts[b.id] > 0)
      .map(b => `
        <label class="filter-checkbox-label">
          <div class="checkbox-left">
            <input type="checkbox" name="brand" value="${b.id}" ${state.selectedBrands.has(b.id) ? 'checked' : ''}>
            <span>${b.name}</span>
          </div>
          <span class="filter-count">(${brandCounts[b.id]})</span>
        </label>
      `).join('');
  }

  // Render Shoe Size Chips
  renderSizeFilterChips();

  bindCheckboxEvents();
}

function renderSizeFilterChips() {
  const sizeContainer = document.getElementById('sizeOptionsList');
  if (!sizeContainer) return;

  let currentSizes = [];
  if (state.selectedGenders.has('men') && !state.selectedGenders.has('women') && !state.selectedGenders.has('kids')) {
    currentSizes = [...MEN_SHOE_SIZES];
  } else if (state.selectedGenders.has('women') && !state.selectedGenders.has('men') && !state.selectedGenders.has('kids')) {
    currentSizes = [...WOMEN_SHOE_SIZES];
  } else if (state.selectedGenders.has('kids') && !state.selectedGenders.has('men') && !state.selectedGenders.has('women')) {
    currentSizes = [...KIDS_SHOE_SIZES];
  } else {
    currentSizes = [...ALL_SHOE_SIZES];
  }

  // Ensure any selected size is always displayed even if not in the default group
  state.selectedSizes.forEach(s => {
    if (!currentSizes.includes(s)) {
      currentSizes.push(s);
    }
  });

  sizeContainer.innerHTML = currentSizes.map(sz => {
    const isSelected = state.selectedSizes.has(sz);
    return `<button type="button" class="size-filter-chip ${isSelected ? 'active' : ''}" data-size="${sz}">${sz}</button>`;
  }).join('');

  sizeContainer.querySelectorAll('.size-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const sz = btn.getAttribute('data-size');
      if (state.selectedSizes.has(sz)) {
        state.selectedSizes.delete(sz);
        btn.classList.remove('active');
      } else {
        state.selectedSizes.add(sz);
        btn.classList.add('active');
      }
      updatePageTitle();
      renderProducts();
    });
  });
}

function bindCheckboxEvents() {
  document.querySelectorAll('input[name="gender"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        state.selectedGenders.add(cb.value);
      } else {
        state.selectedGenders.delete(cb.value);
      }
      renderSizeFilterChips();
      updatePageTitle();
      renderProducts();
    });
  });

  document.querySelectorAll('input[name="category"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        state.selectedCategories.add(cb.value);
      } else {
        state.selectedCategories.delete(cb.value);
      }
      updatePageTitle();
      renderProducts();
    });
  });

  document.querySelectorAll('input[name="brand"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        state.selectedBrands.add(cb.value);
      } else {
        state.selectedBrands.delete(cb.value);
      }
      updatePageTitle();
      renderProducts();
    });
  });
}

function initFilterDomListeners() {
  // Brand search filter within sidebar
  const brandSearchInput = document.getElementById('brandSearchInput');
  if (brandSearchInput) {
    brandSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      let matchCount = 0;
      document.querySelectorAll('#brandOptionsList .filter-checkbox-label').forEach(label => {
        const text = label.textContent.toLowerCase();
        const matches = text.includes(q);
        label.style.display = matches ? 'flex' : 'none';
        if (matches) matchCount++;
      });

      let noBrandMsg = document.getElementById('noBrandMsg');
      if (matchCount === 0) {
        if (!noBrandMsg) {
          noBrandMsg = document.createElement('div');
          noBrandMsg.id = 'noBrandMsg';
          noBrandMsg.style.fontSize = '12px';
          noBrandMsg.style.color = '#9ca3af';
          noBrandMsg.style.padding = '6px 0';
          noBrandMsg.textContent = 'Brand tidak ditemukan';
          document.getElementById('brandOptionsList').appendChild(noBrandMsg);
        }
      } else if (noBrandMsg) {
        noBrandMsg.remove();
      }
    });
  }

  // Price slider
  const priceSlider = document.getElementById('priceRangeSlider');
  const priceMaxInput = document.getElementById('priceMaxInput');
  const maxCatalogPrice = getMaxCatalogPrice();

  if (priceSlider && priceMaxInput) {
    priceSlider.max = maxCatalogPrice;
    if (!isPriceSliderTouched) {
      priceSlider.value = maxCatalogPrice;
      state.maxPrice = maxCatalogPrice;
      priceMaxInput.value = formatRupiah(maxCatalogPrice);
    }

    priceSlider.addEventListener('input', (e) => {
      isPriceSliderTouched = true;
      state.maxPrice = Number(e.target.value);
      priceMaxInput.value = formatRupiah(state.maxPrice);
      renderProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  // Accordion Toggle
  document.querySelectorAll('.filter-group-header').forEach(header => {
    header.addEventListener('click', () => {
      const group = header.closest('.filter-group');
      group.classList.toggle('collapsed');
    });
  });
}

function resetAllFilters() {
  state.selectedGenders.clear();
  state.selectedCategories.clear();
  state.selectedBrands.clear();
  state.selectedSizes.clear();
  state.saleOnly = false;
  isPriceSliderTouched = false;
  const maxCatalogPrice = getMaxCatalogPrice();
  state.maxPrice = maxCatalogPrice;

  const priceSlider = document.getElementById('priceRangeSlider');
  const priceMaxInput = document.getElementById('priceMaxInput');
  if (priceSlider) {
    priceSlider.max = maxCatalogPrice;
    priceSlider.value = maxCatalogPrice;
  }
  if (priceMaxInput) {
    priceMaxInput.value = formatRupiah(maxCatalogPrice);
  }

  document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  renderSizeFilterChips();

  // Clear query string in browser without reload
  const newUrl = window.location.pathname;
  window.history.replaceState({}, '', newUrl);

  updatePageTitle();
  renderProducts();
}

// ============================================================================
// 5. RENDER PRODUCTS WITH FILTERS & ACTIVE TAGS
// ============================================================================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const activeTagsRow = document.getElementById('activeTagsRow');
  const resetBtn = document.getElementById('resetFiltersBtn');

  if (!grid) return;

  // Filter products
  let filtered = PRODUCTS.filter(prod => {
    // Gender filter
    if (state.selectedGenders.size > 0) {
      if (!state.selectedGenders.has(prod.gender)) {
        return false;
      }
    }

    // Category / Sport filter
    if (state.selectedCategories.size > 0) {
      if (!state.selectedCategories.has(prod.category)) {
        return false;
      }
    }

    // Brand filter
    if (state.selectedBrands.size > 0) {
      if (!state.selectedBrands.has(prod.brand)) {
        return false;
      }
    }

    // Size filter (checks per-size stock availability)
    if (state.selectedSizes.size > 0) {
      let hasSizeMatch = false;
      if (prod.sizeStock && typeof prod.sizeStock === 'object') {
        hasSizeMatch = Object.keys(prod.sizeStock).some(s => state.selectedSizes.has(s) && Number(prod.sizeStock[s] || 0) > 0);
      } else if (prod.sizes) {
        hasSizeMatch = prod.sizes.some(s => state.selectedSizes.has(s));
      }
      if (!hasSizeMatch) return false;
    }

    // Price filter (only filter by maxPrice if user actively moved slider)
    if (isPriceSliderTouched && prod.price > state.maxPrice) {
      return false;
    }
    if (prod.price < state.minPrice) {
      return false;
    }

    // Sale filter
    if (state.saleOnly && !prod.isSale) {
      return false;
    }

    return true;
  });

  // Sort products
  if (state.sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Update Result Count
  if (resultsCount) {
    resultsCount.textContent = filtered.length;
  }

  // Render Active Filter Tags
  renderActiveTags(activeTagsRow, resetBtn);

  // Render Product Cards
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="catalog-empty-state">
        <i class="fa-solid fa-box-open empty-icon"></i>
        <h3 class="empty-title">Barang Tidak Tersedia</h3>
        <p class="empty-desc">Maaf, saat ini barang tidak tersedia untuk filter yang Anda pilih.</p>
        <button class="btn-empty-reset" onclick="resetAllFilters()">Reset Filter</button>
      </div>
    `;
    return;
  }

function getShopBadgeHtml(prod) {
  if (prod.tag) {
    const t = prod.tag.toLowerCase();
    let cls = 'tag-custom';
    if (t.includes('new')) cls = 'tag-new';
    else if (t.includes('hot')) cls = 'tag-hot';
    else if (t.includes('best')) cls = 'tag-best';
    else if (t.includes('limit')) cls = 'tag-limited';
    else if (t.includes('sale')) cls = 'tag-sale';
    return `<span class="catalog-card-badge ${cls}">${prod.tag}</span>`;
  }
  if (prod.isSale || prod.discount > 0) {
    return `<span class="catalog-card-badge tag-sale">SALE ${prod.discount ? prod.discount + '%' : ''}</span>`;
  }
  return '';
}

  grid.innerHTML = filtered.map(prod => `
    <article class="catalog-card" data-id="${prod.id}" onclick="window.location.href='product-detail.html?id=${prod.id}'">
      ${getShopBadgeHtml(prod)}
      <a href="product-detail.html?id=${prod.id}" class="catalog-card-img-wrap">
        <img src="${prod.image}" alt="${prod.name}" class="catalog-card-img" loading="lazy">
      </a>
      <div class="catalog-card-content">
        <h3 class="catalog-card-title">
          <a href="product-detail.html?id=${prod.id}">${prod.name}</a>
        </h3>
        <div class="catalog-card-pricing">
          <span class="catalog-card-price">${formatRupiah(prod.price)}</span>
          ${prod.discount > 0 ? `<span class="catalog-card-original">${formatRupiah(prod.originalPrice)}</span>` : ''}
          ${prod.discount > 0 ? `<span class="catalog-card-discount">${prod.discount}%</span>` : ''}
        </div>
      </div>
    </article>
  `).join('');
}

function renderActiveTags(container, resetBtn) {
  if (!container) return;

  const tags = [];
  state.selectedGenders.forEach(g => {
    tags.push({ type: 'gender', value: g, label: g.toUpperCase() });
  });
  state.selectedCategories.forEach(c => {
    tags.push({ type: 'category', value: c, label: c.charAt(0).toUpperCase() + c.slice(1) });
  });
  state.selectedBrands.forEach(b => {
    tags.push({ type: 'brand', value: b, label: b.toUpperCase() });
  });
  state.selectedSizes.forEach(s => {
    tags.push({ type: 'size', value: s, label: `Size: ${s}` });
  });
  if (state.saleOnly) {
    tags.push({ type: 'sale', value: 'true', label: 'SALE' });
  }

  if (resetBtn && resetBtn.classList) {
    resetBtn.classList.toggle('visible', tags.length > 0 || isPriceSliderTouched);
  }

  if (tags.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tags.map(tag => `
    <span class="filter-tag-pill">
      ${tag.label}
      <i class="fa-solid fa-xmark tag-remove-btn" onclick="removeTag('${tag.type}', '${tag.value}')"></i>
    </span>
  `).join('');
}

function removeTag(type, value) {
  if (type === 'gender') {
    state.selectedGenders.delete(value);
    const cb = document.querySelector(`input[name="gender"][value="${value}"]`);
    if (cb) cb.checked = false;
  } else if (type === 'category') {
    state.selectedCategories.delete(value);
    const cb = document.querySelector(`input[name="category"][value="${value}"]`);
    if (cb) cb.checked = false;
  } else if (type === 'brand') {
    state.selectedBrands.delete(value);
    const cb = document.querySelector(`input[name="brand"][value="${value}"]`);
    if (cb) cb.checked = false;
  } else if (type === 'size') {
    state.selectedSizes.delete(value);
    document.querySelectorAll(`.size-filter-chip[data-size="${value}"]`).forEach(btn => btn.classList.remove('active'));
  } else if (type === 'sale') {
    state.saleOnly = false;
  }

  updatePageTitle();
  renderProducts();
}

// ============================================================================
// 6. CART & HEADER UTILITIES
// ============================================================================
function addToCart(productName) {
  if (window.SportsStationCart) {
    const prod = (typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(p => p.name.toLowerCase() === (productName || '').toLowerCase()) : null) || (typeof PRODUCTS !== 'undefined' ? PRODUCTS[0] : null);
    if (prod) {
      window.SportsStationCart.addItem({
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        brand: prod.brand,
        price: prod.price,
        originalPrice: prod.originalPrice || prod.price,
        discount: prod.discount,
        image: prod.image,
        size: 'US 9',
        color: prod.color,
        qty: 1
      });
    }
  }
  showToast(`Ditambahkan ke keranjang: ${productName}`);
}

function showToast(message) {
  let toast = document.querySelector('.sports-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'sports-toast';
    document.body.appendChild(toast);

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '150px',
      right: '24px',
      backgroundColor: '#1f2937',
      color: '#ffffff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      fontSize: '13px',
      fontWeight: '600',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(10px)',
      transition: 'all 0.3s ease',
      pointerEvents: 'none',
      borderLeft: '4px solid #f26522',
      maxWidth: '320px'
    });
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3000);
}

function initHeaderAndScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    if (scrollTopBtn) {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }
  });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const chatBtn = document.getElementById('floatingChatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      showToast('Menghubungkan ke layanan bantuan pelanggan...');
    });
  }
}

function initMegaDropdowns() {
  const dropdownItems = document.querySelectorAll('.has-dropdown');
  dropdownItems.forEach(item => {
    let timeout;
    item.addEventListener('mouseenter', () => {
      clearTimeout(timeout);
      dropdownItems.forEach(other => {
        if (other !== item) other.classList.remove('dropdown-open');
      });
      item.classList.add('dropdown-open');
    });

    item.addEventListener('mouseleave', () => {
      timeout = setTimeout(() => {
        item.classList.remove('dropdown-open');
      }, 120);
    });
  });
}

// Global Exports
window.resetAllFilters = resetAllFilters;

window.applySizeFilterDirectly = function (usSize, gender) {
  let s = (usSize || '').trim().toUpperCase();
  if (!s.startsWith('US') && !isNaN(parseFloat(s))) {
    s = 'US ' + s;
  }
  if (s.startsWith('US') && s.length > 2 && s[2] !== ' ') {
    s = 'US ' + s.slice(2).trim();
  }
  if (gender) {
    state.selectedGenders.clear();
    state.selectedGenders.add(gender.toLowerCase());
    document.querySelectorAll('input[name="gender"]').forEach(cb => {
      cb.checked = (cb.value === gender.toLowerCase());
    });
  }
  state.selectedSizes.clear();
  state.selectedSizes.add(s);
  renderSizeFilterChips();
  updatePageTitle();
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

