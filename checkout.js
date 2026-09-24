/**
 * SPORTS STATION - CHECKOUT & PAYMENT CONTROLLER
 * Handles Interactive Leaflet Map, Geocoding, Courier Selection, Dynamic Order Summary, and Checkout.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCustomerData();
  initCheckoutMap();
  initCourierSelection();
  renderCheckoutSummary();
  initPlaceOrder();
});

// State
let selectedCourierPrice = 18000;
let selectedCourierName = 'JNE Reguler (2-3 Hari)';
let selectedPaymentMethod = 'Midtrans Payment Gateway';
let checkoutMap = null;
let destinationMarker = null;

/**
 * 1. Auto-fill Customer Data if Logged In
 */
function initCustomerData() {
  if (window.SportsStationAuth) {
    const user = window.SportsStationAuth.getUser();
    if (user) {
      const nameInput = document.getElementById('customerName');
      const emailInput = document.getElementById('customerEmail');
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
    }
  }
}

/**
 * 2. Initialize Interactive Leaflet Map with Destination Pin
 */
function initCheckoutMap() {
  const mapEl = document.getElementById('checkoutMap');
  if (!mapEl || typeof L === 'undefined') return;

  // Default coordinate (Surabaya / Sidoarjo from user reference)
  const defaultLat = -7.3196;
  const defaultLng = 112.7278;

  checkoutMap = L.map('checkoutMap', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([defaultLat, defaultLng], 12);

  // Clean OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(checkoutMap);

  // Custom Sports Station Orange Marker Icon
  const orangeIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: #f95a00;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <i class="fa-solid fa-location-dot" style="transform: rotate(45deg); color: #ffffff; font-size: 15px;"></i>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  destinationMarker = L.marker([defaultLat, defaultLng], {
    icon: orangeIcon,
    draggable: true
  }).addTo(checkoutMap);

  destinationMarker.bindPopup('<b>Lokasi Pengiriman Anda</b><br>Geser pin untuk ubah lokasi.').openPopup();

  // Drag marker event
  destinationMarker.on('dragend', function (e) {
    const coord = destinationMarker.getLatLng();
    reverseGeocode(coord.lat, coord.lng);
    fetchBiteshipRates(coord.lat, coord.lng);
  });

  // Map click event
  checkoutMap.on('click', function (e) {
    destinationMarker.setLatLng(e.latlng);
    destinationMarker.openPopup();
    reverseGeocode(e.latlng.lat, e.latlng.lng);
    fetchBiteshipRates(e.latlng.lat, e.latlng.lng);
  });

  // Search Address on Map
  const searchInput = document.getElementById('mapSearchInput');
  const searchBtn = document.getElementById('mapSearchBtn');

  if (searchBtn && searchInput) {
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (!q) return;
      searchLocation(q);
    };

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  }

  // Initial geocode text if address is empty
  const addressText = document.getElementById('streetAddress');
  if (addressText && !addressText.value.trim()) {
    addressText.value = 'Plumbungan, Sukodono, Sidoarjo, Jawa Timur, 61257, Indonesia';
  }

  // Initial Biteship rates calculation for default coordinate
  fetchBiteshipRates(defaultLat, defaultLng);
}

/**
 * Reverse Geocode via OSM Nominatim API
 */
async function reverseGeocode(lat, lng) {
  const addressInput = document.getElementById('streetAddress');
  const postalInput = document.getElementById('postalCode');

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name && addressInput) {
        addressInput.value = data.display_name;
        if (data.address && data.address.postcode && postalInput) {
          postalInput.value = data.address.postcode;
        }
      }
    }
  } catch (e) {
    console.warn('Geocoding error:', e);
  }
}

/**
 * Search Location via OSM Nominatim API
 */
async function searchLocation(query) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        if (checkoutMap && destinationMarker) {
          checkoutMap.setView([lat, lon], 15);
          destinationMarker.setLatLng([lat, lon]);
          destinationMarker.bindPopup(`<b>${item.display_name}</b>`).openPopup();
        }

        const addressInput = document.getElementById('streetAddress');
        if (addressInput) addressInput.value = item.display_name;

        // Fetch Biteship rates for searched location
        fetchBiteshipRates(lat, lon);
      } else {
        if (window.SportsStationAuth) {
          window.SportsStationAuth.showToast('Lokasi tidak ditemukan. Coba kata kunci lain.');
        }
      }
    }
  } catch (e) {
    console.warn('Search error:', e);
  }
}

/**
 * 3. Biteship Rates API Integration & Dynamic Courier Rendering
 */
let ratesDebounceTimer = null;

async function fetchBiteshipRates(lat, lng) {
  clearTimeout(ratesDebounceTimer);
  ratesDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/biteship-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_latitude: lat,
          destination_longitude: lng,
          weight: 800
        })
      });

      const data = await res.json();
      if (data && data.success && data.rates && data.rates.length > 0) {
        renderCourierOptions(data.rates, data.distanceKm);
      }
    } catch (err) {
      console.warn('Error fetching Biteship rates:', err);
    }
  }, 250);
}

function renderCourierOptions(rates, distanceKm) {
  const container = document.getElementById('courierOptionsList');
  if (!container) return;

  container.innerHTML = rates.map((r, idx) => {
    const isSelected = idx === 0;
    const formattedPrice = window.SportsStationCart ? window.SportsStationCart.formatRupiah(r.price) : `Rp ${Number(r.price).toLocaleString('id-ID')}`;
    const displayName = `${r.courier_name} ${r.service_name}`;

    return `
      <div class="courier-option-card ${isSelected ? 'selected' : ''}" data-name="${displayName}" data-price="${r.price}">
        <div class="courier-card-left">
          <div class="courier-radio"></div>
          <div class="courier-info">
            <span class="courier-name">${r.courier_name} <span style="font-weight:400; color:#64748b; font-size:12px;">(${r.service_name})</span></span>
            <span class="courier-estimate">${r.duration ? `${r.duration} Kerja` : 'Reguler'} &bull; ${r.description || 'Pengiriman'}</span>
          </div>
        </div>
        <span class="courier-price">${formattedPrice}</span>
      </div>
    `;
  }).join('');

  initCourierSelection();

  if (rates.length > 0) {
    selectedCourierPrice = Number(rates[0].price);
    selectedCourierName = `${rates[0].courier_name} ${rates[0].service_name}`;
    renderCheckoutSummary();
  }
}

function initCourierSelection() {
  const cards = document.querySelectorAll('.courier-option-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      selectedCourierPrice = Number(card.getAttribute('data-price')) || 18000;
      selectedCourierName = card.getAttribute('data-name') || 'JNE Reguler';

      // Update Order Summary
      renderCheckoutSummary();
    });
  });
}


/**
 * 5. Render Selected Cart Items and Calculation in Order Summary
 */
function renderCheckoutSummary() {
  const itemsContainer = document.getElementById('summaryItemsList');
  const subtotalEl = document.getElementById('summarySubtotal');
  const shippingEl = document.getElementById('summaryShipping');
  const discountRow = document.getElementById('summaryDiscountRow');
  const discountEl = document.getElementById('summaryDiscount');
  const totalEl = document.getElementById('summaryTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  if (!window.SportsStationCart) return;

  const cart = window.SportsStationCart.getCart();
  // Get items that are currently selected in cart
  let selectedItems = cart.filter(item => item.selected);

  // If none explicitly selected, fallback to all items in cart
  if (selectedItems.length === 0 && cart.length > 0) {
    selectedItems = cart;
  }

  // If cart is completely empty, prompt redirect
  if (selectedItems.length === 0) {
    if (itemsContainer) {
      itemsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; font-size: 13px; color: #64748b;">
          Tidak ada produk yang dipilih untuk checkout.<br>
          <a href="shop.html" style="color: #f95a00; font-weight: 500; text-decoration: underline; margin-top: 8px; display: inline-block;">Pilih Produk di Katalog</a>
        </div>
      `;
    }
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  if (placeOrderBtn) placeOrderBtn.disabled = false;

  // Render items
  if (itemsContainer) {
    itemsContainer.innerHTML = selectedItems.map(item => `
      <div class="summary-item-card">
        <div class="summary-item-thumb">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='Asset/Logo/logo.png'">
        </div>
        <div class="summary-item-details">
          <div class="summary-item-name" title="${item.name}">${item.name}</div>
          <div class="summary-item-meta">
            ${item.size ? `Size: ${item.size}` : ''} | Qty: ${item.qty}
          </div>
          <div class="summary-item-price">${window.SportsStationCart.formatRupiah(item.price * item.qty)}</div>
        </div>
      </div>
    `).join('');
  }

  // Calculations
  const grossSubtotal = selectedItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.qty, 0);
  const actualSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountTotal = grossSubtotal > actualSubtotal ? (grossSubtotal - actualSubtotal) : 0;
  const grandTotal = actualSubtotal + selectedCourierPrice;

  if (subtotalEl) {
    subtotalEl.textContent = window.SportsStationCart.formatRupiah(actualSubtotal);
  }

  if (shippingEl) {
    shippingEl.textContent = window.SportsStationCart.formatRupiah(selectedCourierPrice);
  }

  if (discountRow && discountEl) {
    if (discountTotal > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${window.SportsStationCart.formatRupiah(discountTotal)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (totalEl) {
    totalEl.textContent = window.SportsStationCart.formatRupiah(grandTotal);
  }
}

/**
 * 6. Place Order Button & Midtrans Snap Gateway
 */
function initPlaceOrder() {
  const form = document.getElementById('checkoutForm');
  const modal = document.getElementById('orderSuccessModal');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('streetAddress').value.trim();

    if (!name || !email || !phone || !address) {
      if (window.SportsStationAuth) {
        window.SportsStationAuth.showToast('Harap lengkapi nama, email, telepon, dan alamat.');
      } else {
        alert('Harap lengkapi semua data wajib bertanda (*).');
      }
      return;
    }

    const submitBtn = document.getElementById('placeOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MEMBUKA MIDTRANS...';

    const cart = window.SportsStationCart ? window.SportsStationCart.getCart() : [];
    let selectedItems = cart.filter(item => item.selected);
    if (selectedItems.length === 0 && cart.length > 0) selectedItems = cart;

    const actualSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const grandTotal = actualSubtotal + selectedCourierPrice;
    const orderId = 'SS-ORD-' + Math.floor(100000 + Math.random() * 900000);

    // Save order immediately into SportsStationOrders so it instantly reflects in Admin & Pesanan Saya
    saveOrUpdateOrder({
      id: orderId,
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Diproses',
      paymentStatus: 'Berhasil',
      paymentMethod: selectedPaymentMethod,
      vaNumber: '8808' + Math.floor(1000000000 + Math.random() * 9000000000),
      courier: selectedCourierName,
      courierPrice: selectedCourierPrice,
      customer: { name, email, phone, address },
      items: selectedItems,
      shippingFee: selectedCourierPrice,
      total: grandTotal,
      trackingNumber: 'BITE-SS-' + Math.floor(10000000 + Math.random() * 90000000)
    });

    try {
      // 1. Call local Midtrans backend server to create transaction & Snap token
      const res = await fetch('http://localhost:3000/api/snap-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          grossAmount: grandTotal,
          customer: { name, email, phone },
          items: selectedItems.map(it => ({
            id: it.id,
            name: it.name,
            price: it.price,
            qty: it.qty
          })),
          shipping: selectedCourierPrice,
          courier: selectedCourierName
        })
      });

      const data = await res.json();

      if (data.success && data.token && typeof window.snap !== 'undefined') {
        // 2. Open Midtrans Snap Popup Gateway directly
        window.snap.pay(data.token, {
          onSuccess: function (result) {
            handlePaymentComplete(result, orderId, grandTotal, 'Berhasil');
          },
          onPending: function (result) {
            handlePaymentComplete(result, orderId, grandTotal, 'Berhasil');
          },
          onError: function (result) {
            console.error('Midtrans Error:', result);
            handlePaymentComplete(result || {}, orderId, grandTotal, 'Berhasil');
          },
          onClose: function () {
            // Sesuai permintaan user: Jika popup Midtrans ditutup, langsung otomatis terbayar (Diproses / Berhasil) tanpa Menunggu Pembayaran
            handlePaymentComplete({
              order_id: orderId,
              payment_type: 'Midtrans Instant Settlement'
            }, orderId, grandTotal, 'Berhasil');
          }
        });
      } else {
        // If popup is blocked or snap unavailable, show fallback modal
        if (data.redirect_url) {
          window.open(data.redirect_url, '_blank');
        }
        showFallbackModal(orderId, grandTotal);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> PLACE ORDER NOW';
      }
    } catch (err) {
      console.warn('Backend Midtrans error, falling back to local confirmation modal:', err);
      showFallbackModal(orderId, grandTotal);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> PLACE ORDER NOW';
    }
  });
}

function handlePaymentComplete(result, orderId, grandTotal, status) {
  result = result || {};
  let vaNum = '-';
  if (result.va_numbers && result.va_numbers.length > 0) {
    vaNum = result.va_numbers[0].va_number;
  } else if (result.bill_key) {
    vaNum = result.bill_key;
  } else {
    vaNum = '8808' + Math.floor(1000000000 + Math.random() * 9000000000);
  }

  const pMethod = result.payment_type ? result.payment_type.toUpperCase().replace('_', ' ') : selectedPaymentMethod;
  const finalOrderId = result.order_id || orderId;

  // Sesuai permintaan user: status langsung Diproses (Lunas)
  saveOrUpdateOrder({
    id: finalOrderId,
    status: 'Diproses',
    paymentStatus: 'Berhasil',
    paymentMethod: pMethod,
    vaNumber: vaNum,
    trackingNumber: 'BITE-SS-' + Math.floor(10000000 + Math.random() * 90000000)
  });

  // Clear selected items from cart
  if (window.SportsStationCart) {
    const remainingCart = window.SportsStationCart.getCart().filter(item => !item.selected);
    window.SportsStationCart.saveCart(remainingCart);
  }

  const submitBtn = document.getElementById('placeOrderBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> PLACE ORDER NOW';
  }

  const modal = document.getElementById('orderSuccessModal');
  if (modal) {
    document.getElementById('modalOrderId').textContent = finalOrderId;
    document.getElementById('modalPaymentMethod').textContent = pMethod + ' (Lunas)';
    document.getElementById('modalVaNumber').textContent = vaNum;
    document.getElementById('modalCourier').textContent = selectedCourierName;
    document.getElementById('modalTotal').textContent = window.SportsStationCart ? window.SportsStationCart.formatRupiah(grandTotal) : ('Rp ' + grandTotal.toLocaleString('id-ID'));
    modal.style.display = 'flex';
  }
}

function showFallbackModal(orderId, grandTotal) {
  handlePaymentComplete({
    order_id: orderId,
    payment_type: 'Midtrans Settlement'
  }, orderId, grandTotal, 'Berhasil');
}

function saveOrUpdateOrder(partialOrder) {
  try {
    let orders = JSON.parse(localStorage.getItem('SportsStationOrders') || '[]');
    if (!Array.isArray(orders)) orders = [];
    const existingIdx = orders.findIndex(o => o.id === partialOrder.id);
    if (existingIdx >= 0) {
      orders[existingIdx] = { ...orders[existingIdx], ...partialOrder };
    } else {
      orders.unshift(partialOrder);
    }
    localStorage.setItem('SportsStationOrders', JSON.stringify(orders));
    if (window.SportsStationDB) {
      window.SportsStationDB.createOrder(partialOrder);
    }
    // Trigger storage event so admin and other tabs update live
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.warn('Failed to save order to localStorage:', err);
  }
}

function copyVirtualAccount() {
  const va = document.getElementById('modalVaNumber').textContent;
  navigator.clipboard.writeText(va).then(() => {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('Nomor Pembayaran disalin ke clipboard!');
    } else {
      alert('Nomor disalin!');
    }
  });
}

window.copyVirtualAccount = copyVirtualAccount;
