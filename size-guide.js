/**
 * SPORTS STATION - SIZE GUIDE MODAL (size-guide.js)
 * Provides interactive shoe size charts (Men, Women, Kids)
 * and navigates to the shop page with the corresponding size filter applied.
 */

(function () {
  // Size Chart Data
  const SIZE_CHARTS = {
    men: [
      { us: 'US 7', uk: '6', eur: '40', cm: '25.0 cm' },
      { us: 'US 7.5', uk: '6.5', eur: '40.5', cm: '25.5 cm' },
      { us: 'US 8', uk: '7', eur: '41', cm: '26.0 cm' },
      { us: 'US 8.5', uk: '7.5', eur: '42', cm: '26.5 cm' },
      { us: 'US 9', uk: '8', eur: '42.5', cm: '27.0 cm' },
      { us: 'US 9.5', uk: '8.5', eur: '43', cm: '27.5 cm' },
      { us: 'US 10', uk: '9', eur: '44', cm: '28.0 cm' },
      { us: 'US 10.5', uk: '9.5', eur: '44.5', cm: '28.5 cm' },
      { us: 'US 11', uk: '10', eur: '45', cm: '29.0 cm' },
      { us: 'US 11.5', uk: '10.5', eur: '45.5', cm: '29.5 cm' },
      { us: 'US 12', uk: '11', eur: '46', cm: '30.0 cm' }
    ],
    women: [
      { us: 'US 5', uk: '2.5', eur: '35.5', cm: '22.0 cm' },
      { us: 'US 5.5', uk: '3', eur: '36', cm: '22.5 cm' },
      { us: 'US 6', uk: '3.5', eur: '36.5', cm: '23.0 cm' },
      { us: 'US 6.5', uk: '4', eur: '37.5', cm: '23.5 cm' },
      { us: 'US 7', uk: '4.5', eur: '38', cm: '24.0 cm' },
      { us: 'US 7.5', uk: '5', eur: '38.5', cm: '24.5 cm' },
      { us: 'US 8', uk: '5.5', eur: '39', cm: '25.0 cm' },
      { us: 'US 8.5', uk: '6', eur: '40', cm: '25.5 cm' },
      { us: 'US 9', uk: '6.5', eur: '40.5', cm: '26.0 cm' }
    ],
    kids: [
      { us: 'US 1Y', uk: '13.5', eur: '32', cm: '20.0 cm' },
      { us: 'US 1.5Y', uk: '1', eur: '33', cm: '20.5 cm' },
      { us: 'US 2Y', uk: '1.5', eur: '33.5', cm: '21.0 cm' },
      { us: 'US 2.5Y', uk: '2', eur: '34', cm: '21.5 cm' },
      { us: 'US 3Y', uk: '2.5', eur: '35', cm: '22.0 cm' }
    ]
  };

  let activeTab = 'men';
  let modalOverlay = null;

  // Initialize Modal
  function initSizeGuideModal() {
    createModalElements();
    bindTriggers();
  }

  function createModalElements() {
    if (document.getElementById('sizeGuideModalOverlay')) return;

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'sizeGuideModalOverlay';
    modalOverlay.className = 'size-guide-modal-overlay';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');

    modalOverlay.innerHTML = `
      <div class="size-guide-modal">
        <!-- Header -->
        <div class="size-guide-header">
          <div class="size-guide-title-box">
            <div class="size-guide-icon">
              <i class="fa-solid fa-ruler-combined"></i>
            </div>
            <div>
              <h3 class="size-guide-title">Panduan Ukuran Sepatu (Size Guide)</h3>
              <p class="size-guide-subtitle">Standar konversi ukuran sepatu resmi Sports Station</p>
            </div>
          </div>
          <button class="size-guide-close-btn" id="closeSizeGuideModal" aria-label="Tutup">&times;</button>
        </div>

        <!-- Body -->
        <div class="size-guide-body">
          <!-- Segmented Tabs -->
          <div class="size-guide-tabs">
            <button class="size-guide-tab active" data-tab="men">Pria (Men)</button>
            <button class="size-guide-tab" data-tab="women">Wanita (Women)</button>
            <button class="size-guide-tab" data-tab="kids">Anak-anak (Kids)</button>
          </div>

          <!-- Tip Banner -->
          <div class="size-guide-tip">
            <i class="fa-solid fa-circle-info"></i>
            <span><strong>Panduan:</strong> Gunakan tabel konversi ini untuk menentukan ukuran sepatu yang paling pas dan nyaman untuk Anda.</span>
          </div>

          <!-- Table Container -->
          <div class="size-table-container">
            <table class="size-table">
              <thead>
                <tr>
                  <th>US</th>
                  <th>UK</th>
                  <th>EUR</th>
                  <th>Panjang Kaki</th>
                </tr>
              </thead>
              <tbody id="sizeTableBody">
                <!-- Dynamically rendered rows -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="size-guide-footer">
          <span>* Ukuran mengacu pada standar resmi Sports Station.</span>
          <span style="color: #f26522; font-weight: 500;">Sports Station Indonesia</span>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Event: Close Button
    const closeBtn = document.getElementById('closeSizeGuideModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSizeGuide);
    }

    // Event: Backdrop Click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeSizeGuide();
      }
    });

    // Event: Escape Key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeSizeGuide();
      }
    });

    // Event: Tab switching
    const tabBtns = modalOverlay.querySelectorAll('.size-guide-tab');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-tab');
        renderTableRows();
      });
    });

    renderTableRows();
  }

  function renderTableRows() {
    const tbody = document.getElementById('sizeTableBody');
    if (!tbody) return;

    const rows = SIZE_CHARTS[activeTab] || [];
    
    // Check if on PDP and there's a selected size
    let highlightedSize = '';
    const activePdpBtn = document.querySelector('.pdp-size-btn.active');
    if (activePdpBtn) {
      highlightedSize = activePdpBtn.textContent.trim().toUpperCase();
    }

    tbody.innerHTML = rows.map(item => {
      const isMatch = highlightedSize && item.us.toUpperCase() === highlightedSize;
      return `
        <tr class="${isMatch ? 'highlighted' : ''}">
          <td><span class="size-us-badge">${item.us}</span></td>
          <td>${item.uk}</td>
          <td>${item.eur}</td>
          <td>${item.cm}</td>
        </tr>
      `;
    }).join('');
  }

  // Navigate to shop with size filter
  window.selectSizeAndGo = function (usSize) {
    closeSizeGuide();
    
    // If currently on shop.html and state is accessible
    if (typeof window.applySizeFilterDirectly === 'function') {
      window.applySizeFilterDirectly(usSize);
      return;
    }

    // Otherwise navigate to shop.html with query parameter
    window.location.href = `shop.html?size=${encodeURIComponent(usSize)}`;
  };

  function openSizeGuide(defaultTab) {
    if (!modalOverlay) createModalElements();
    if (defaultTab && SIZE_CHARTS[defaultTab]) {
      activeTab = defaultTab;
      const tabBtns = modalOverlay.querySelectorAll('.size-guide-tab');
      tabBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === activeTab);
      });
    }
    renderTableRows();
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSizeGuide() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function bindTriggers() {
    // Links with href="#size-guide"
    document.querySelectorAll('a[href="#size-guide"], .pdp-size-guide-link, #homeSizeGuideLink, [data-open-size-guide]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Detect gender if on product-detail.html
        let defaultTab = 'men';
        const brandOrGenderEl = document.getElementById('pdpBreadcrumbCurrent');
        if (brandOrGenderEl && brandOrGenderEl.textContent.toLowerCase().includes('women')) {
          defaultTab = 'women';
        }

        openSizeGuide(defaultTab);
      });
    });

    // Also check footer links that mention "Size Guide" or "Panduan Ukuran"
    document.querySelectorAll('a').forEach(a => {
      const text = (a.textContent || '').toLowerCase();
      if ((text.includes('panduan ukuran') || text.includes('size guide')) && !a.hasAttribute('data-bound-guide')) {
        a.setAttribute('data-bound-guide', 'true');
        a.addEventListener('click', (e) => {
          e.preventDefault();
          openSizeGuide();
        });
      }
    });
  }

  // Expose global methods
  window.openSizeGuide = openSizeGuide;
  window.closeSizeGuide = closeSizeGuide;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSizeGuideModal);
  } else {
    initSizeGuideModal();
  }
})();
