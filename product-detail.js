/**
 * SPORTS STATION - PRODUCT DETAIL PAGE SCRIPT (product-detail.js)
 * Manages Dynamic PDP Data Loading, Gallery Switching, Size Selection, and Cart Additions
 */

// ============================================================================
// 1. PRODUCTS DATASET
// ============================================================================
const PRODUCTS = [
  // --- NIKE MEN'S RUNNING (FROM ASSET/SEPATU/NIKE/MEN/RUNNING) ---
  {
    id: 'nike-pegasus-plus',
    name: "Nike Pegasus Plus Men's Road Running Shoes",
    brand: 'Nike',
    gender: 'men',
    category: 'running',
    sku: '0888-NIKR0026001',
    price: 2499000,
    originalPrice: 2499000,
    discount: 0,
    isSale: false,
    color: 'Volt Crimson',
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    description: "Nike Pegasus Plus memadukan busa ZoomX penuh di sepanjang sol untuk memberikan sensasi lari paling bertenaga dan responsif di setiap kilometer latihan Anda."
  },
  {
    id: 'nike-zoom-fly-6',
    name: "Nike Zoom Fly 6 Men's Road Racing Shoes",
    brand: 'Nike',
    gender: 'men',
    category: 'running',
    sku: '0888-NIKR0026002',
    price: 2699000,
    originalPrice: 2699000,
    discount: 0,
    isSale: false,
    color: 'Ghost Green',
    image: 'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif',
    description: "Didesain untuk latihan maraton dan kompetisi jalan raya, Nike Zoom Fly 6 menggabungkan pelat serat karbon penuh dengan busa ZoomX yang ultra-responsif."
  },
  {
    id: 'nike-vomero-plus-cm',
    name: "Nike Vomero Plus CM Men's Running Shoes - Obsidian",
    brand: 'Nike',
    gender: 'men',
    category: 'running',
    sku: '0888-NIKR0026003',
    price: 1149500,
    originalPrice: 2299000,
    discount: 50,
    isSale: true,
    color: 'Obsidian',
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS+CM.avif',
    description: "Nike Vomero Plus CM menghadirkan bantalan premium lembut dengan transisi tumit-ke-jari yang sangat mulus untuk perlindungan sendi saat berlari."
  },
  {
    id: 'nike-structure-plus',
    name: "Nike Structure Plus Men's Road Running Shoes",
    brand: 'Nike',
    gender: 'men',
    category: 'running',
    sku: '0888-NIKR0026004',
    price: 974500,
    originalPrice: 1949000,
    discount: 50,
    isSale: true,
    color: 'Pure Platinum',
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    description: "Nike Structure Plus menawarkan stabilitas optimal bagi pelari overpronasi dengan sistem penopang midfoot yang kokoh dan sirkulasi udara berpori."
  },
  {
    id: 'nike-alphafly-4',
    name: "Nike Alphafly 4 Men's Marathon Racing Shoes",
    brand: 'Nike',
    gender: 'men',
    category: 'running',
    sku: '0888-NIKR0026005',
    price: 4099000,
    originalPrice: 4099000,
    discount: 0,
    isSale: false,
    color: 'White / Volt',
    image: 'Asset/Sepatu/Nike/Men/Running/Alphafly4.avif',
    description: "Diciptakan untuk memecahkan rekor maraton dunia, dilengkapi pod Zoom Air ganda di kaki depan, busa ZoomX tebal, dan pelat karbon Flyplate."
  },
  {
    id: 'nike-vomero-plus',
    name: "Nike Vomero Plus Men's Running Shoes",
    brand: 'Nike',
    gender: 'men',
    category: 'running',
    sku: '0888-NIKR0026006',
    price: 2199000,
    originalPrice: 2199000,
    discount: 0,
    isSale: false,
    color: 'Black Metallic',
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif',
    description: "Bantalan tingkat maksimal untuk pelari harian yang menginginkan kenyamanan empuk tanpa mengurangi stabilitas langkah."
  },

  // --- NIKE WOMEN'S RUNNING (FROM ASSET/SEPATU/NIKE/WOMAN/RUNNING) ---
  {
    id: 'nike-w-pegasus-42',
    name: "W Nike Air Zoom Pegasus 42 Women's Running Shoes",
    brand: 'Nike',
    gender: 'women',
    category: 'running',
    sku: '0888-NIKR0026007',
    price: 2099000,
    originalPrice: 2099000,
    discount: 0,
    isSale: false,
    color: 'Pink White',
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif',
    description: "Sepatu lari wanita terpopuler dengan bantalan ganda Air Zoom dan engineered mesh yang menopang kaki wanita dengan pas dan presisi."
  },
  {
    id: 'nike-w-pegasus-easyon',
    name: "W Pegasus 42 EasyOn Women's Running Shoes",
    brand: 'Nike',
    gender: 'women',
    category: 'running',
    sku: '0888-NIKR0026008',
    price: 1049500,
    originalPrice: 2099000,
    discount: 50,
    isSale: true,
    color: 'Soft Pink',
    image: 'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif',
    description: "Sistem EasyOn revolusioner memudahkan pemakaian sepatu tanpa repot mengikat tali secara manual, tetap memberikan performa lari bertenaga."
  },
  {
    id: 'nike-w-vomero-18',
    name: "W Nike Vomero 18 Women's Road Running Shoes",
    brand: 'Nike',
    gender: 'women',
    category: 'running',
    sku: '0888-NIKR0026009',
    price: 2299000,
    originalPrice: 2299000,
    discount: 0,
    isSale: false,
    color: 'Lilac Pink',
    image: 'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif',
    description: "Bantalan ekstra tebal dan empuk untuk pengalaman lari melayang, khusus dikalibrasi untuk proporsi dan ritme pelari wanita."
  },
  {
    id: 'nike-w-vaporfly-next-4',
    name: "W ZoomX Vaporfly Next% 4 Women's Competition Shoes",
    brand: 'Nike',
    gender: 'women',
    category: 'running',
    sku: '0888-NIKR0026010',
    price: 3699000,
    originalPrice: 3699000,
    discount: 0,
    isSale: false,
    color: 'Black Gold',
    image: 'Asset/Sepatu/Nike/Woman/Running/W+ZOOMX+VAPORFLY+NEXT%+4++KH.avif',
    description: "Sepatu balap maraton elit untuk wanita yang mengincar catatan waktu terbaik pribadi dengan efisiensi energi maksimal."
  },

  // --- NIKE RUNNING KIDS ---
  {
    id: 'nike-star-runner-4-kids',
    name: "Nike Star Runner 4 Kids Road Running Shoes",
    brand: 'Nike',
    gender: 'kids',
    category: 'running',
    sku: '0888-NIKR0026011',
    price: 649000,
    originalPrice: 649000,
    discount: 0,
    isSale: false,
    color: 'Pure Platinum',
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    description: "Nike Star Runner 4 dirancang khusus untuk kenyamanan dan durabilitas anak-anak saat bermain aktif dan berolahraga di sekolah mau pun lapangan."
  },
  {
    id: 'nike-revolution-7-kids',
    name: "Nike Revolution 7 Kids Running Shoes - Black/Volt",
    brand: 'Nike',
    gender: 'kids',
    category: 'running',
    sku: '0888-NIKR0026012',
    price: 449500,
    originalPrice: 899000,
    discount: 50,
    isSale: true,
    color: 'Volt Crimson',
    image: 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    description: "Nike Revolution 7 Kids memberikan bantalan empuk dan traksi kuat untuk langkah lincah anak setiap hari."
  },
  {
    id: 'nike-flex-runner-2-kids',
    name: "Nike Flex Runner 2 Kids Slip-On Shoes",
    brand: 'Nike',
    gender: 'kids',
    category: 'running',
    sku: '0888-NIKR0026013',
    price: 599000,
    originalPrice: 599000,
    discount: 0,
    isSale: false,
    color: 'Soft Pink',
    image: 'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif',
    description: "Desain bootie elastis tanpa tali memudahkan anak-anak memakai dan melepas sepatu secara mandiri."
  }
];

function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Current Selected Size & Color
let selectedSize = 'US 9';
let selectedColor = 'Standard';
let cartTotal = 0;

// ============================================================================
// 2. INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initProductData();
  initAddToCartButton();
  initThumbnails();
  initHeaderAndScrollTop();
  initMegaDropdowns();
  initMobileDrawer();

  if (window.SportsStationDB && window.SportsStationDB.isConfigured()) {
    window.SportsStationDB.fetchProducts().then(() => {
      initProductData();
    }).catch(e => console.warn('Gagal sync produk dari Supabase di PDP:', e));
  }
});

// ============================================================================
// 3. LOAD PRODUCT FROM URL PARAMETER & CATALOG
// ============================================================================
function initProductData() {
  const urlParams = new URLSearchParams(window.location.search);
  const prodId = urlParams.get('id') || 'nike-pegasus-plus';

  let catalog = PRODUCTS;
  try {
    const rawDel = localStorage.getItem('SportsStationDeletedProducts');
    const deletedIds = rawDel ? JSON.parse(rawDel) : [];

    const raw = localStorage.getItem('SportsStationCatalog');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        catalog = parsed.filter(p => !deletedIds.includes(String(p.id)));
      }
    }
  } catch (e) {
    console.warn('Failed to parse catalog from localStorage', e);
  }

  let product = catalog.find(p => String(p.id) === String(prodId));
  if (!product) {
    product = PRODUCTS.find(p => String(p.id) === String(prodId)) || catalog[0] || PRODUCTS[0];
  }
  window.currentLoadedProduct = product;

  // Update Page Title
  document.title = `${product.name} | Sports Station`;

  // Breadcrumb
  const breadcrumbCurrent = document.getElementById('pdpBreadcrumbCurrent');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name;

  // Main Image
  const mainImg = document.getElementById('pdpMainImg');
  if (mainImg) {
    mainImg.referrerPolicy = 'no-referrer';
    mainImg.src = product.image;
    mainImg.alt = product.name;
    mainImg.onerror = function() { this.src = 'Asset/Logo/logo.png'; };
  }

  // Thumbnail image
  const thumbImg = document.getElementById('pdpThumbImg');
  if (thumbImg) {
    thumbImg.referrerPolicy = 'no-referrer';
    thumbImg.src = product.image;
    thumbImg.alt = product.name;
    thumbImg.onerror = function() { this.src = 'Asset/Logo/logo.png'; };
  }
  const thumbList = document.querySelectorAll('.pdp-thumb img');
  thumbList.forEach(thumb => {
    thumb.referrerPolicy = 'no-referrer';
    thumb.src = product.image;
    thumb.alt = product.name;
    thumb.onerror = function() { this.src = 'Asset/Logo/logo.png'; };
  });

  // Product Brand
  const brandEl = document.getElementById('pdpBrand');
  if (brandEl) brandEl.textContent = product.brand || 'Sports Station';

  // Product Title
  const titleEl = document.getElementById('pdpTitle');
  if (titleEl) titleEl.textContent = product.name;

  // SKU
  const skuEl = document.getElementById('pdpSku');
  if (skuEl) skuEl.textContent = product.sku || '0888-NIKR0026001';

  // Special Tag / Product Badge
  const specialTag = document.getElementById('pdpSpecialTag');
  if (specialTag) {
    if (product.tag) {
      specialTag.innerHTML = `<i class="fa-solid fa-tag"></i> ${product.tag}`;
      specialTag.style.display = 'inline-flex';
    } else if (product.discount > 0 || product.isSale) {
      specialTag.innerHTML = `<i class="fa-solid fa-circle-info"></i> SPECIAL PRICE`;
      specialTag.style.display = 'inline-flex';
    } else {
      specialTag.style.display = 'none';
    }
  }

  // Price & Original Price
  const currentPriceEl = document.getElementById('pdpCurrentPrice');
  if (currentPriceEl) currentPriceEl.textContent = formatRupiah(product.price);

  const origPriceEl = document.getElementById('pdpOriginalPrice');
  const discountEl = document.getElementById('pdpDiscountBadge');

  if (product.discount > 0) {
    if (origPriceEl) {
      origPriceEl.textContent = formatRupiah(product.originalPrice || product.price);
      origPriceEl.style.display = 'inline';
    }
    if (discountEl) {
      discountEl.textContent = `${product.discount}%`;
      discountEl.style.display = 'inline';
    }
  } else {
    if (origPriceEl) origPriceEl.style.display = 'none';
    if (discountEl) discountEl.style.display = 'none';
  }

  // Color text
  const colorBtn = document.getElementById('pdpColorBtn');
  selectedColor = product.color || 'Standard';
  if (colorBtn) colorBtn.textContent = selectedColor;

  // Description
  const descEl = document.getElementById('pdpDescription');
  if (descEl) descEl.textContent = product.description || 'Produk olahraga berkualitas tinggi persembahan Sports Station.';

  // Render "You may also like" related shelf
  renderRelatedProducts(product);

  // Initialize size options for this product
  initSizeSelector(product);
}

// ============================================================================
// 4. SIZE SELECTOR INTERACTION (PER-SIZE STOCK ENABLED)
// ============================================================================
function initSizeSelector(product) {
  const sizeGrid = document.querySelector('.pdp-size-grid');
  if (!sizeGrid) return;

  // Build sizeStock mapping
  let sizeStockMap = {};
  if (product && product.sizeStock && typeof product.sizeStock === 'object' && Object.keys(product.sizeStock).length > 0) {
    sizeStockMap = { ...product.sizeStock };
  } else {
    // Generate default size breakdown if missing
    const cat = (product.category || '').toLowerCase();
    const isFootwear = ['running', 'sneakers', 'basketball', 'football', 'training', 'badminton', 'tennis', 'sandals', 'walking'].includes(cat) || (!cat.includes('bra') && !cat.includes('shirt') && !cat.includes('pants') && !cat.includes('short') && !cat.includes('bag') && !cat.includes('cap') && !cat.includes('sock'));
    const isApparel = ['tshirt', 'shorts', 'pants', 'sports-bra', 'jacket', 'tanktop', 'swimming'].includes(cat);

    if (isFootwear) {
      const defaultShoeSizes = ['39', '40', '41', '42', '43', '44'];
      defaultShoeSizes.forEach(s => { sizeStockMap[s] = 6; });
    } else if (isApparel) {
      const defaultApparelSizes = ['S', 'M', 'L', 'XL'];
      defaultApparelSizes.forEach(s => { sizeStockMap[s] = 8; });
    } else {
      sizeStockMap['All Size'] = 15;
    }
  }

  const sizes = Object.keys(sizeStockMap);

  const urlParams = new URLSearchParams(window.location.search);
  let requestedSize = (urlParams.get('size') || '').trim();

  // Pick first available size with stock > 0
  let activeSize = '';
  if (requestedSize && sizes.includes(requestedSize) && Number(sizeStockMap[requestedSize] || 0) > 0) {
    activeSize = requestedSize;
  } else {
    const firstInStock = sizes.find(s => Number(sizeStockMap[s] || 0) > 0);
    activeSize = firstInStock || sizes[0];
  }
  selectedSize = activeSize;

  // Render Size Buttons
  sizeGrid.innerHTML = sizes.map(sz => {
    const qty = Number(sizeStockMap[sz] || 0);
    const isOut = qty <= 0;
    const isSelected = sz === activeSize;
    return `
      <button type="button" 
              class="pdp-size-btn ${isSelected ? 'active' : ''} ${isOut ? 'out-of-stock' : ''}" 
              data-size="${sz}" 
              data-stock="${qty}"
              ${isOut ? 'disabled title="Stok ukuran ini habis"' : ''}>
        <span class="pdp-size-label">${sz}</span>
        ${isOut ? '<span class="pdp-size-stock-sub">Habis</span>' : (qty <= 3 ? `<span class="pdp-size-stock-sub">Sisa ${qty}</span>` : '')}
      </button>
    `;
  }).join('');

  // Stock feedback element
  let feedbackEl = document.getElementById('pdpSizeStockFeedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'pdpSizeStockFeedback';
    feedbackEl.className = 'pdp-size-stock-feedback';
    sizeGrid.parentNode.insertBefore(feedbackEl, sizeGrid.nextSibling);
  }

  function updateFeedback(sizeName) {
    if (!feedbackEl) return;
    const stockQty = Number(sizeStockMap[sizeName] || 0);
    feedbackEl.className = 'pdp-size-stock-feedback';

    if (stockQty <= 0) {
      feedbackEl.classList.add('out-stock');
      feedbackEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Stok untuk ukuran <strong>${sizeName}</strong> saat ini <strong>Habis</strong>.`;
    } else if (stockQty <= 3) {
      feedbackEl.classList.add('low-stock');
      feedbackEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Stok terbatas! Ukuran <strong>${sizeName}</strong> tersisa <strong>${stockQty} unit</strong> lagi.`;
    } else {
      feedbackEl.classList.add('in-stock');
      feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Stok tersedia: <strong>${stockQty} unit</strong> untuk ukuran <strong>${sizeName}</strong>. Siap kirim!`;
    }
  }

  updateFeedback(selectedSize);

  // Attach click listeners to size buttons
  const sizeBtns = sizeGrid.querySelectorAll('.pdp-size-btn:not(:disabled)');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeGrid.querySelectorAll('.pdp-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.getAttribute('data-size');
      updateFeedback(selectedSize);
    });
  });
}

// ============================================================================
// 5. GALLERY THUMBNAIL CLICKING
// ============================================================================
function initThumbnails() {
  const thumbs = document.querySelectorAll('.pdp-thumb');
  const mainImg = document.getElementById('pdpMainImg');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) {
        mainImg.style.opacity = '0.6';
        setTimeout(() => {
          mainImg.src = thumb.querySelector('img').src;
          mainImg.style.opacity = '1';
        }, 150);
      }
    });
  });
}

// ============================================================================
// 6. ADD TO CART INTERACTION (WITH SIZE STOCK CHECK)
// ============================================================================
function initAddToCartButton() {
  const addBtn = document.getElementById('pdpAddToCartBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const currentProd = window.currentLoadedProduct || (typeof PRODUCTS !== 'undefined' && PRODUCTS.length ? PRODUCTS[0] : null);
    if (!currentProd) return;

    const size = selectedSize || 'All Size';
    const color = selectedColor || currentProd.color || 'Standard';

    // Verify stock for selected size
    if (currentProd.sizeStock && typeof currentProd.sizeStock === 'object') {
      const available = Number(currentProd.sizeStock[size] || 0);
      if (available <= 0) {
        showToast(`Maaf, ukuran ${size} saat ini habis! Silakan pilih ukuran lain.`);
        return;
      }
    }

    try {
      if (window.SportsStationCart && typeof window.SportsStationCart.addItem === 'function') {
        window.SportsStationCart.addItem({
          id: currentProd.id,
          name: currentProd.name,
          sku: currentProd.sku || ('0888-' + (currentProd.brand ? currentProd.brand.toUpperCase() : 'SS') + Math.floor(10000000 + Math.random() * 90000000)),
          brand: currentProd.brand || 'Sports Station',
          price: Number(currentProd.price) || 0,
          originalPrice: Number(currentProd.originalPrice) || Number(currentProd.price) || 0,
          discount: Number(currentProd.discount) || 0,
          image: currentProd.image || '',
          size: size,
          color: color,
          qty: 1
        });
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
    }

    showToast(`Berhasil ditambahkan ke keranjang: ${currentProd.name} (Ukuran: ${size})`);
  });
}

// ============================================================================
// 7. RENDER "YOU MAY ALSO LIKE" RELATED SHELF
// ============================================================================
function renderRelatedProducts(currentProd) {
  const relatedGrid = document.getElementById('relatedGrid');
  if (!relatedGrid) return;

  // Filter products excluding current
  const relatedList = PRODUCTS.filter(p => p.id !== currentProd.id).slice(0, 5);

  relatedGrid.innerHTML = relatedList.map(item => `
    <a href="product-detail.html?id=${item.id}" class="related-card">
      <div class="related-card-img-wrap">
        <img src="${item.image}" alt="${item.name}" class="related-card-img" loading="lazy">
      </div>
      <h4 class="related-card-title">${item.name}</h4>
      <div class="related-card-price">${formatRupiah(item.price)}</div>
    </a>
  `).join('');
}

// ============================================================================
// 8. UTILITIES (TOAST, HEADER, DROPDOWNS)
// ============================================================================
function showToast(message, type = 'success') {
  if (window.SportsStationAuth && typeof window.SportsStationAuth.showToast === 'function') {
    window.SportsStationAuth.showToast(message, type);
    return;
  }
  let toast = document.querySelector('.sports-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'sports-toast';
    document.body.appendChild(toast);
  }

  let cleanMsg = String(message || '').replace(/^[✅🎉⚠️❌ℹ️🏷️✨\s]+/, '').trim();
  if (!cleanMsg) cleanMsg = 'Success';

  let iconClass = 'fa-solid fa-circle-check';
  let iconColor = '#22c55e';
  toast.className = 'sports-toast';

  const lower = String(message || '').toLowerCase();
  if (type === 'error' || lower.includes('gagal') || lower.includes('habis') || lower.includes('batal') || lower.includes('belum')) {
    iconClass = 'fa-solid fa-circle-xmark';
    iconColor = '#ef4444';
    toast.classList.add('toast-error');
  } else if (type === 'warning' || lower.includes('peringatan') || lower.includes('harap') || lower.includes('wajib')) {
    iconClass = 'fa-solid fa-triangle-exclamation';
    iconColor = '#f59e0b';
    toast.classList.add('toast-warning');
  }

  toast.innerHTML = `
    <i class="${iconClass} sports-toast-icon" style="color: ${iconColor};"></i>
    <span class="sports-toast-text">${cleanMsg}</span>
  `;

  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
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
      showToast('Menghubungkan ke layanan bantuan pelanggan Sports Station...');
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

function initMobileDrawer() {
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerClose = document.getElementById('drawerClose');
  const drawerOverlay = document.getElementById('drawerOverlay');

  if (!mobileDrawer) return;

  function openDrawer() {
    mobileDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('open');
    document.querySelectorAll('.drawer-subview').forEach(s => s.classList.remove('active'));
    if (drawerOverlay) drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // Subview open buttons (BRANDS, SPORTS, MEN, WOMEN, KIDS, EQUIPMENT)
  document.querySelectorAll('.drawer-link-btn[data-subview]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-subview') || btn.dataset.subview;
      if (targetId) {
        const subview = document.getElementById(targetId);
        if (subview) {
          subview.classList.add('active');
        }
      }
    });
  });

  // Subview back buttons
  document.querySelectorAll('.drawer-back-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const subview = btn.closest('.drawer-subview');
      if (subview) {
        subview.classList.remove('active');
      }
    });
  });

  // Close buttons inside subviews
  document.querySelectorAll('.drawer-sub-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer();
    });
  });

  // Accordion toggle behavior for A-B, C-E, F-K, FOOTWEAR, CLOTHING, etc.
  document.querySelectorAll('.brand-acc-header, .drawer-acc-header').forEach(header => {
    header.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const group = header.closest('.brand-acc-group, .drawer-acc-group');
      if (group) {
        group.classList.toggle('active');
      }
    });
  });

  const drawerLinks = document.querySelectorAll('.drawer-links a, .brand-item-link, .drawer-sub-link');
  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  window.openMobileBrandDrawer = function() {
    openDrawer();
    const brandsSubview = document.getElementById('drawerSubBrands');
    if (brandsSubview) brandsSubview.classList.add('active');
  };
}
