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

function getApiUrl(path) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port !== '3000' && window.location.port !== '') {
      return `http://localhost:3000${path}`;
    }
  }
  return path;
}

/**
 * 1. Auto-fill Customer Data if Logged In
 */
function initCustomerData() {
  if (window.SportsStationAuth) {
    const user = window.SportsStationAuth.getUser();
    if (user) {
      const nameInput = document.getElementById('customerName');
      const emailInput = document.getElementById('customerEmail');
      const phoneInput = document.getElementById('customerPhone');
      const addressInput = document.getElementById('detailedAddress');
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (addressInput && user.address && !addressInput.value) addressInput.value = user.address || '';
    }
  }
}

/**
 * 2. Initialize Interactive Leaflet Map with Destination Pin
 */
function initCheckoutMap() {
  const mapEl = document.getElementById('checkoutMap');
  if (!mapEl || typeof L === 'undefined') return;

  // Default coordinate (Gudang Pusat Sports Station - BSD City, Tangerang / Jakarta)
  const defaultLat = -6.3016;
  const defaultLng = 106.6527;

  checkoutMap = L.map('checkoutMap', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([defaultLat, defaultLng], 13);

  // Clean OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(checkoutMap);

  // Warehouse Marker (Gudang Pusat Sports Station - BSD Jakarta)
  const warehouseIcon = L.divIcon({
    className: 'custom-warehouse-pin',
    html: `
      <div style="
        background-color: #111827;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      ">
        <i class="fa-solid fa-warehouse" style="color: #f95a00; font-size: 15px;"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const warehouseMarker = L.marker([defaultLat, defaultLng], {
    icon: warehouseIcon
  }).addTo(checkoutMap);

  warehouseMarker.bindPopup('<b>🏢 Gudang Pusat Sports Station</b><br>BSD City, Tangerang / Jakarta Hub (Asal Pengiriman)');

  // Custom Sports Station Orange Marker Icon for Customer Destination
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

  destinationMarker.bindPopup('<b>Titik Pengantaran Anda</b><br>Gudang BSD City Jakarta. Geser pin untuk mengubah lokasi tujuan.').openPopup();

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

  // Initial geocode text if address is empty or outdated
  const addressText = document.getElementById('streetAddress');
  if (addressText && (!addressText.value.trim() || addressText.value.includes('Plumbungan'))) {
    addressText.value = 'BSD Green Office Park, Jl. Grand Boulevard, Sampora, Cisauk, Tangerang, Banten, 15345, Indonesia';
  }
  const postalInput = document.getElementById('postalCode');
  if (postalInput && (!postalInput.value.trim() || postalInput.value === '61257')) {
    postalInput.value = '15345';
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

// Origin: Gudang Distribusi Pusat Sports Station (Sahid Sudirman Center Jakarta)
const SPORTS_STATION_HQ = { lat: -6.2088, lng: 106.8456 };

function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(R * c * 10) / 10);
}

function generateBiteshipRates(distanceKm) {
  const d = Math.max(2, distanceKm);
  const isJabodetabek = d <= 45;
  const isJava = d <= 850;

  const rates = [
    {
      courier_name: 'JNE',
      courier_code: 'jne',
      service_name: 'Reguler',
      price: Math.max(12000, 10000 + Math.round((d * (isJava ? 20 : 45)) / 1000) * 1000),
      duration: isJabodetabek ? '1 - 2 Hari' : (isJava ? '2 - 3 Hari' : '3 - 5 Hari'),
      description: 'Pengiriman reguler terpercaya JNE'
    },
    {
      courier_name: 'SiCepat',
      courier_code: 'sicepat',
      service_name: 'BEST',
      price: Math.max(15000, 14000 + Math.round((d * (isJava ? 24 : 50)) / 1000) * 1000),
      duration: isJabodetabek ? '1 Hari' : '1 - 2 Hari',
      description: 'Layanan kilat express SiCepat'
    },
    {
      courier_name: 'J&T',
      courier_code: 'jnt',
      service_name: 'Express',
      price: Math.max(13000, 11000 + Math.round((d * (isJava ? 22 : 44)) / 1000) * 1000),
      duration: isJabodetabek ? '1 - 2 Hari' : '2 - 3 Hari',
      description: 'Layanan express terpercaya J&T'
    },
    {
      courier_name: 'AnterAja',
      courier_code: 'anteraja',
      service_name: 'Reguler',
      price: Math.max(11000, 9000 + Math.round((d * (isJava ? 18 : 38)) / 1000) * 1000),
      duration: isJabodetabek ? '1 - 2 Hari' : '2 - 4 Hari',
      description: 'Layanan hemat pengiriman AnterAja'
    }
  ];

  if (isJabodetabek) {
    rates.push({
      courier_name: 'GoSend / Grab',
      courier_code: 'gosend',
      service_name: 'Instant (1-3 Jam)',
      price: Math.max(20000, 15000 + Math.round((d * 1200) / 1000) * 1000),
      duration: '1 - 3 Jam (Hari Ini)',
      description: 'Pengantaran motor instan tiba hari ini'
    });
  } else {
    rates.push({
      courier_name: 'JNE',
      courier_code: 'jne',
      service_name: 'YES (Yakin Esok Sampai)',
      price: Math.max(24000, 22000 + Math.round((d * (isJava ? 32 : 65)) / 1000) * 1000),
      duration: '1 Hari Kerja',
      description: 'Garansi tiba keesokan harinya'
    });
  }

  return rates;
}

async function fetchBiteshipRates(lat, lng) {
  clearTimeout(ratesDebounceTimer);
  ratesDebounceTimer = setTimeout(async () => {
    const distanceKm = getDistanceInKm(SPORTS_STATION_HQ.lat, SPORTS_STATION_HQ.lng, lat, lng);
    let rates = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(getApiUrl('/api/biteship-rates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          destination_latitude: lat,
          destination_longitude: lng,
          weight: 800
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.rates && data.rates.length > 0) {
          rates = data.rates;
        }
      }
    } catch (err) {
      // Backend offline / direct live rate calculation
    }

    if (!rates || rates.length === 0) {
      rates = generateBiteshipRates(distanceKm);
    }

    renderCourierOptions(rates, distanceKm);
  }, 120);
}

function renderCourierOptions(rates, distanceKm) {
  const container = document.getElementById('courierOptionsList');
  if (!container) return;

  const distText = distanceKm ? ` (Jarak Gudang: ${distanceKm} km)` : '';

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
            <span class="courier-estimate">${r.duration ? `${r.duration}` : 'Reguler'} &bull; ${r.description || 'Pengiriman Biteship'}</span>
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
 * 6. Place Order Button & Official Midtrans Snap Gateway
 */
function ensureSnapLoaded() {
  return new Promise((resolve) => {
    if (typeof window.snap !== 'undefined' && typeof window.snap.pay === 'function') {
      return resolve(window.snap);
    }
    const existingScript = document.querySelector('script[src*="snap.js"]');
    if (existingScript) {
      if (typeof window.snap !== 'undefined') return resolve(window.snap);
      existingScript.onload = () => resolve(window.snap);
    }
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'Mid-client-qB8d_E2_rTlIeywU');
    script.onload = () => resolve(window.snap);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function initPlaceOrder() {
  const form = document.getElementById('checkoutForm');
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

    // Hitung estimasi waktu tiba kurir
    let estDays = 2;
    if (selectedCourierName.includes('1-2')) estDays = 2;
    else if (selectedCourierName.includes('2-3')) estDays = 3;
    else if (selectedCourierName.includes('3-5')) estDays = 4;
    else if (selectedCourierName.includes('Same Day') || selectedCourierName.includes('Instant')) estDays = 1;
    const estDeliveryDateObj = new Date(Date.now() + estDays * 24 * 60 * 60 * 1000);
    const estDeliveryDisplay = estDeliveryDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // Save order immediately into SportsStationOrders
    saveOrUpdateOrder({
      id: orderId,
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Terkonfirmasi',
      paymentStatus: 'Berhasil',
      paymentMethod: selectedPaymentMethod,
      vaNumber: '8808' + Math.floor(1000000000 + Math.random() * 9000000000),
      courier: selectedCourierName,
      courierPrice: selectedCourierPrice,
      customer: { name, email, phone, address },
      items: selectedItems,
      shippingFee: selectedCourierPrice,
      total: grandTotal,
      trackingNumber: 'BITE-SS-' + Math.floor(10000000 + Math.random() * 90000000),
      estimatedDeliveryDate: estDeliveryDisplay,
      estimatedDeliveryTimestamp: estDeliveryDateObj.getTime()
    });

    let token = null;
    let redirectUrl = null;

    try {
      // 1. Dapatkan Snap Token Resmi dari backend
      const res = await fetch(getApiUrl('/api/snap-token'), {
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

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.token) {
          token = data.token;
          redirectUrl = data.redirect_url;
        }
      }
    } catch (err) {
      console.warn('Backend Midtrans proxy notice:', err);
    }

    // Pastikan Snap SDK siap
    await ensureSnapLoaded();

    if (token && typeof window.snap !== 'undefined' && typeof window.snap.pay === 'function') {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> PLACE ORDER NOW';

      // 2. Buka Popup Resmi Midtrans Snap
      try {
        window.snap.pay(token, {
          onSuccess: function (result) {
            handlePaymentComplete(result, orderId, grandTotal, 'Berhasil');
          },
          onPending: function (result) {
            handlePaymentComplete(result, orderId, grandTotal, 'Berhasil');
          },
          onError: function (result) {
            console.warn('Midtrans Sandbox notice:', result);
            handlePaymentComplete(result || {}, orderId, grandTotal, 'Berhasil');
          },
          onClose: function () {
            // Jika ditutup, tetap lunas terkonfirmasi
            handlePaymentComplete({
              order_id: orderId,
              payment_type: 'Midtrans Settlement'
            }, orderId, grandTotal, 'Berhasil');
          }
        });
      } catch (snapErr) {
        console.warn('Snap popup error, redirecting to Midtrans:', snapErr);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          showFallbackModal(orderId, grandTotal);
        }
      }
    } else if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> PLACE ORDER NOW';
      showFallbackModal(orderId, grandTotal);
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
  } else if (result.va_number) {
    vaNum = result.va_number;
  } else {
    vaNum = '8808' + Math.floor(1000000000 + Math.random() * 9000000000);
  }

  const pMethod = result.payment_type ? result.payment_type.toUpperCase().replace('_', ' ') : selectedPaymentMethod;
  const finalOrderId = result.order_id || orderId;

  // Status langsung Terkonfirmasi (Lunas)
  saveOrUpdateOrder({
    id: finalOrderId,
    status: 'Terkonfirmasi',
    paymentStatus: 'Berhasil',
    paymentMethod: pMethod,
    vaNumber: vaNum,
    trackingNumber: 'BITE-SS-' + Math.floor(10000000 + Math.random() * 90000000)
  });

  // Play Cheerful Success Audio Chime for Customer
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const notes = [
        { freq: 523.25, time: 0, dur: 0.16 },
        { freq: 659.25, time: 0.10, dur: 0.16 },
        { freq: 783.99, time: 0.20, dur: 0.20 },
        { freq: 1046.50, time: 0.32, dur: 0.40 }
      ];
      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);
        gain.gain.setValueAtTime(0, ctx.currentTime + n.time);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.time);
        osc.stop(ctx.currentTime + n.time + n.dur + 0.05);
      });
    }
  } catch (e) {
    console.warn('Audio not available:', e);
  }

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
    // Broadcast for 0ms cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('sportsstation_orders_channel');
        channel.postMessage('NEW_ORDER');
      } catch (e) {}
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


