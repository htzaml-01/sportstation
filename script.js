/**
 * SPORTS STATION - INTERACTIVE JAVASCRIPT
 * Handles Carousels, Scroll Animations, Brand Slider, and Interactive UI Elements
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  initBrandSlider();
  renderHomeProductShelves();
  initProductShelf();
  initPosterCarousel();
  initHeaderAndScrollTop();
  initMobileDrawer();
  initInteractiveCartAndChat();
  initMegaDropdowns();
});

/* ==========================================================================
   1. HERO PROMO BANNER CAROUSEL
   ========================================================================== */
function initHeroCarousel() {
  const track = document.getElementById('heroTrack');
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const carouselContainer = document.querySelector('.hero-carousel-container');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoSlideTimer = null;

  function updateSlide(index) {
    if (index < 0) {
      currentIndex = totalSlides - 1;
    } else if (index >= totalSlides) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      updateSlide(currentIndex + 1);
    }, 4500);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  // Event Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateSlide(currentIndex - 1);
      startAutoSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateSlide(currentIndex + 1);
      startAutoSlide();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      updateSlide(idx);
      startAutoSlide();
    });
  });

  // Pause on hover
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopAutoSlide);
    carouselContainer.addEventListener('mouseleave', startAutoSlide);
  }

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoSlide();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoSlide();
  }, { passive: true });

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        updateSlide(currentIndex + 1); // Swipe left
      } else {
        updateSlide(currentIndex - 1); // Swipe right
      }
    }
  }

  startAutoSlide();
}

/* ==========================================================================
   2. BRAND LOGO SLIDER (MANUAL NAVIGATION)
   ========================================================================== */
function initBrandSlider() {
  const brandTrack = document.getElementById('brandTrack');
  const prevBtn = document.getElementById('brandPrev');
  const nextBtn = document.getElementById('brandNext');

  if (!brandTrack) return;

  const scrollAmount = 300;

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      brandTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      brandTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   3. HOME PRODUCT SHELVES (DYNAMIC CATALOG SYNC WITH LOCALSTORAGE)
   ========================================================================== */
function formatRupiahHome(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function bindProductCardClicks() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach((card) => {
    card.style.cursor = 'pointer';
    card.onclick = () => {
      let prodId = card.getAttribute('data-id');
      if (!prodId) {
        const name = (card.querySelector('.prod-name')?.textContent || '').toLowerCase();
        if (name.includes('pegasus plus')) prodId = 'nike-pegasus-plus';
        else if (name.includes('zoom fly 6')) prodId = 'nike-zoom-fly-6';
        else if (name.includes('alphafly')) prodId = 'nike-alphafly-4';
        else if (name.includes('vomero 18')) prodId = 'nike-w-vomero-18';
        else if (name.includes('structure')) prodId = 'nike-structure-plus';
        else if (name.includes('easyon')) prodId = 'nike-w-pegasus-easyon';
        else if (name.includes('vaporfly')) prodId = 'nike-w-vaporfly-next-4';
        else if (name.includes('vomero') && name.includes('obsidian')) prodId = 'nike-vomero-plus-cm';
        else if (name.includes('vomero')) prodId = 'nike-vomero-plus';
        else if (name.includes('pegasus')) prodId = 'nike-w-pegasus-42';
        else prodId = 'nike-pegasus-plus';
      }
      window.location.href = `product-detail.html?id=${prodId}`;
    };
  });
}

function renderHomeProductShelves() {
  const shelfTrack = document.getElementById('shelfTrack');
  const saleShelfTrack = document.getElementById('saleShelfTrack');
  if (!shelfTrack) return;

  let catalog = null;
  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    if (raw) {
      catalog = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read SportsStationCatalog from localStorage', e);
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    bindProductCardClicks();
    return;
  }

  function isProductNewForHome(prod) {
    // 1. If admin explicitly removed/cleared the tag (empty string), do NOT show in Newest Collection
    if (prod.tag === '' || prod.tag === null) {
      return false;
    }

    const tagUpper = (prod.tag || '').toUpperCase().trim();

    // 2. If tagged SALE or product has >= 50% discount, it belongs to Sale 50% shelf, not Newest Collection
    if (tagUpper === 'SALE' || (prod.discount && prod.discount >= 50)) {
      return false;
    }

    // 3. 7-Day Rule: If createdAt is present, check if product is <= 7 days old
    if (prod.createdAt) {
      const createdTime = new Date(prod.createdAt).getTime();
      if (!isNaN(createdTime)) {
        const ageDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
        if (ageDays > 7) {
          // Expired after 7 days
          return false;
        }
      }
    }

    // 4. If product has tag NEW, HOT, BEST SELLER, or LIMITED, show in shelf
    if (tagUpper === 'NEW' || tagUpper === 'HOT' || tagUpper === 'BEST SELLER' || tagUpper === 'LIMITED') {
      return true;
    }

    // 5. Default catalog products without explicit tag:
    // If not on sale and discount is 0, consider as new
    if (!prod.isSale && (!prod.discount || prod.discount === 0)) {
      return true;
    }

    return false;
  }

  function isProductForSale50Shelf(prod) {
    const discount = Number(prod.discount) || 0;
    const price = Number(prod.price) || 0;
    const origPrice = Number(prod.originalPrice) || 0;
    const tagUpper = (prod.tag || '').toUpperCase().trim();

    // 1. Discount >= 50%
    if (discount >= 50) return true;

    // 2. Original price at least double the selling price
    if (origPrice >= price * 2 && price > 0) return true;

    // 3. Tagged SALE with significant discount
    if (tagUpper === 'SALE' && discount >= 30) return true;

    return false;
  }

  function getHomeBadgeHtml(prod) {
    if (prod.tag) {
      const t = prod.tag.toLowerCase();
      let bg = '#111827';
      if (t.includes('new')) bg = '#10b981';
      else if (t.includes('hot')) bg = '#f95a00';
      else if (t.includes('best')) bg = '#d97706';
      else if (t.includes('limit')) bg = '#8b5cf6';
      else if (t.includes('sale')) bg = '#dc2626';
      return `<div class="prod-badge-new" style="background-color: ${bg};">${prod.tag}</div>`;
    }
    // If admin explicitly cleared tag
    if (prod.tag === '') {
      return '';
    }
    if (prod.isSale || prod.discount > 0) {
      return `<div class="prod-badge-sale">SALE</div>`;
    }
    return `<div class="prod-badge-new">NEW</div>`;
  }

  // 1. Render Newest Collection Shelf (New products within 7 days, tag not removed)
  const newestProducts = catalog.filter(isProductNewForHome);
  const displayNewest = newestProducts.length > 0 
    ? newestProducts 
    : catalog.filter(p => !p.isSale && (!p.discount || p.discount < 50)).slice(0, 8);

  shelfTrack.innerHTML = displayNewest.map(prod => `
    <div class="product-card" data-id="${prod.id}">
      ${getHomeBadgeHtml(prod)}
      <div class="prod-img-box">
        <img src="${prod.image}" alt="${prod.name}" class="prod-img" loading="lazy" onerror="this.src='Asset/Logo/logo.png'">
      </div>
      <div class="prod-info">
        <span class="prod-brand">${prod.brand ? prod.brand.toUpperCase() : 'SPORTS STATION'}</span>
        <h4 class="prod-name">${prod.name}</h4>
        <div class="prod-price-wrap">
          <span class="prod-price">${formatRupiahHome(prod.price)}</span>
          ${prod.discount > 0 ? `<span class="prod-price-original" style="font-size: 11px; text-decoration: line-through; color: #94a3b8; margin-left: 6px;">${formatRupiahHome(prod.originalPrice || prod.price)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // 2. Render Big Sale Shelf (Discount >= 50% prioritized)
  if (saleShelfTrack) {
    const sale50Products = catalog.filter(isProductForSale50Shelf);
    sale50Products.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));

    let displaySale = [...sale50Products];
    if (displaySale.length < 4) {
      const otherSales = catalog.filter(p => (p.isSale || (p.discount && p.discount > 0)) && !displaySale.some(s => s.id === p.id));
      otherSales.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));
      displaySale = displaySale.concat(otherSales);
    }

    if (displaySale.length > 0) {
      saleShelfTrack.innerHTML = displaySale.slice(0, 10).map(prod => {
        const discText = prod.discount ? prod.discount + '%' : '50%';
        return `
          <div class="product-card sale-card" data-id="${prod.id}">
            <div class="prod-badge-sale">SALE ${discText}</div>
            <div class="prod-img-box">
              <img src="${prod.image}" alt="${prod.name}" class="prod-img" loading="lazy" onerror="this.src='Asset/Logo/logo.png'">
            </div>
            <div class="prod-info">
              <h4 class="prod-name">${prod.name}</h4>
              <div class="prod-price-wrap">
                <span class="prod-price-sale">${formatRupiahHome(prod.price)}</span>
                <span class="prod-price-original">${formatRupiahHome(prod.originalPrice || (prod.price * 2))}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  bindProductCardClicks();
}

// Live sync across tabs when admin saves or updates catalog
window.addEventListener('storage', (e) => {
  if (!e.key || e.key === 'SportsStationCatalog') {
    renderHomeProductShelves();
  }
});

/* ==========================================================================
   3. PRODUCT SHELF CAROUSEL (NEWEST COLLECTION - MANUAL NAVIGATION)
   ========================================================================== */
function initProductShelf() {
  const shelfTrack = document.getElementById('shelfTrack');
  const prevBtn = document.getElementById('shelfPrev');
  const nextBtn = document.getElementById('shelfNext');
  const dots = document.querySelectorAll('.shelf-dot');

  if (!shelfTrack) return;

  const getScrollStep = () => {
    const firstCard = shelfTrack.querySelector('.product-card');
    return firstCard ? (firstCard.offsetWidth + 20) * 2 : 440;
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      shelfTrack.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      shelfTrack.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
  }

  // Update dots on scroll
  shelfTrack.addEventListener('scroll', () => {
    const maxScroll = shelfTrack.scrollWidth - shelfTrack.clientWidth;
    if (maxScroll <= 0) return;
    const progress = shelfTrack.scrollLeft / maxScroll;
    const activeDotIndex = Math.min(
      dots.length - 1,
      Math.floor(progress * dots.length + 0.1)
    );

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeDotIndex);
    });
  });

  // Clicking dot scrolls to section of products
  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const maxScroll = shelfTrack.scrollWidth - shelfTrack.clientWidth;
      const targetScroll = (idx / (dots.length - 1)) * maxScroll;
      shelfTrack.scrollTo({ left: targetScroll, behavior: 'smooth' });
    });
  });
}

/* ==========================================================================
   4. POSTER BANNER CAROUSEL (DIBAWAH NEWEST COLLECTION)
   ========================================================================== */
function initPosterCarousel() {
  const track = document.getElementById('posterTrack');
  const slides = document.querySelectorAll('.poster-slide');
  const dots = document.querySelectorAll('.poster-dot');
  const prevBtn = document.getElementById('posterPrev');
  const nextBtn = document.getElementById('posterNext');
  const container = document.querySelector('.poster-carousel-container');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoSlideTimer = null;

  function updateSlide(index) {
    if (index < 0) {
      currentIndex = totalSlides - 1;
    } else if (index >= totalSlides) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      updateSlide(currentIndex + 1);
    }, 5000);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateSlide(currentIndex - 1);
      startAutoSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateSlide(currentIndex + 1);
      startAutoSlide();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      updateSlide(idx);
      startAutoSlide();
    });
  });

  if (container) {
    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);
  }

  startAutoSlide();
}

/* ==========================================================================
   5. HEADER SCROLL & BACK TO TOP BUTTON
   ========================================================================== */
function initHeaderAndScrollTop() {
  const header = document.getElementById('mainHeader');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Header shadow on scroll
    if (header) {
      if (scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Scroll to Top visibility
    if (scrollTopBtn) {
      if (scrollY > 350) {
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
}

/* ==========================================================================
   5. MOBILE DRAWER NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerClose = document.getElementById('drawerClose');
  const drawerOverlay = document.getElementById('drawerOverlay');

  function openDrawer() {
    mobileDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  const drawerLinks = document.querySelectorAll('.drawer-links a');
  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ==========================================================================
   6. INTERACTIVE CART, SEARCH, & FLOATING CHAT
   ========================================================================== */
function initInteractiveCartAndChat() {
  const cartCountEl = document.getElementById('cartCount');
  let cartCount = 0;

  // Clicking product cards navigates to product detail page
  bindProductCardClicks();

  // Floating Chat Widget
  const chatBtn = document.getElementById('floatingChatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      showToast('Halo! Layanan Bantuan Sports Station siap melayani Anda.');
    });
  }

  // Search input enter action
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          showToast(`Mencari produk: "${query}"`);
        }
      }
    });
  }
}

/**
 * Toast Notification Helper
 */
function showToast(message) {
  let toast = document.querySelector('.sports-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'sports-toast';
    document.body.appendChild(toast);

    // Dynamic toast styles
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

/**
 * Mega Dropdown Menu Hover Enhancer
 */
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
