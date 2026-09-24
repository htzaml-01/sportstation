/**
 * SPORTS STATION - PESANAN SAYA (MY ORDERS) CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initOrdersPage();
});

let currentTab = 'semua';
let searchQuery = '';

function getStoredOrders() {
  try {
    const raw = localStorage.getItem('SportsStationOrders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse SportsStationOrders:', e);
  }
  return [];
}

function initOrdersPage() {
  setupTabs();
  setupSearch();
  renderOrders();
  setupTrackingModal();

  // Real-time synchronization when orders are placed or updated
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === 'SportsStationOrders') {
      renderOrders();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderOrders();
    }
  });
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.orders-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab') || 'semua';
      renderOrders();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('ordersSearchInput');
  if (input) {
    input.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderOrders();
    });
  }
}

function renderOrders() {
  const container = document.getElementById('ordersListContainer');
  const emptyState = document.getElementById('ordersEmptyState');
  if (!container) return;

  const orders = getStoredOrders();

  // Filter by tab
  let filtered = orders.filter(ord => {
    if (currentTab === 'semua') return true;
    if (currentTab === 'menunggu-pembayaran') return ord.status.toLowerCase().includes('menunggu');
    if (currentTab === 'diproses') return ord.status.toLowerCase().includes('proses') || ord.status.toLowerCase().includes('diproses');
    if (currentTab === 'dikirim') return ord.status.toLowerCase().includes('kirim') || ord.status.toLowerCase().includes('dikirim');
    if (currentTab === 'selesai') return ord.status.toLowerCase().includes('selesai');
    if (currentTab === 'dibatalkan') return ord.status.toLowerCase().includes('batal');
    return true;
  });

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(ord => {
      const matchId = ord.id.toLowerCase().includes(searchQuery);
      const matchItem = ord.items.some(it => it.name.toLowerCase().includes(searchQuery));
      const matchCourier = (ord.courier || '').toLowerCase().includes(searchQuery);
      return matchId || matchItem || matchCourier;
    });
  }

  // Update tab counts
  updateTabCounts(orders);

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = filtered.map(ord => {
    const statusClass = getStatusClass(ord.status);
    const formattedTotal = window.SportsStationCart ? window.SportsStationCart.formatRupiah(ord.total) : `Rp ${ord.total.toLocaleString('id-ID')}`;

    return `
      <article class="order-card" data-order-id="${ord.id}">
        <!-- Header -->
        <div class="order-card-header">
          <div class="order-header-meta">
            <span class="order-number">
              <i class="fa-solid fa-receipt" style="color: #f95a00;"></i>
              ${ord.id}
              <button class="order-copy-btn" onclick="copyText('${ord.id}')" title="Salin Nomor Pesanan">
                <i class="fa-regular fa-copy"></i>
              </button>
            </span>
            <span class="order-date">${ord.displayDate || ord.date}</span>
          </div>
          <span class="order-status-badge ${statusClass}">
            <i class="fa-solid fa-circle" style="font-size: 7px;"></i>
            ${ord.status}
          </span>
        </div>

        <!-- Delivery subheader -->
        <div class="order-delivery-bar">
          <div class="order-courier-pill">
            <i class="fa-solid fa-truck-fast"></i>
            <span>${ord.courier || 'Ekspedisi Standard'}</span>
            <span class="order-resi-code">(${ord.trackingNumber || 'BITE-SS-' + ord.id})</span>
          </div>
          <div style="font-size: 11.5px; color: #64748b;">
            Pengiriman dari <strong>Sports Station Jakarta HQ</strong>
          </div>
        </div>

        <!-- Items list -->
        <div class="order-items-box">
          ${ord.items.map(item => `
            <div class="order-item-row">
              <div class="order-item-info">
                <div class="order-item-thumb">
                  <img src="${item.image}" alt="${item.name}" onerror="this.src='Asset/Logo/logo.png'">
                </div>
                <div class="order-item-texts">
                  <h3>${item.name}</h3>
                  <div class="order-item-meta">
                    ${item.size ? `Ukuran: ${item.size}` : ''} | Jumlah: ${item.qty}x
                  </div>
                </div>
              </div>
              <div class="order-item-price">
                ${window.SportsStationCart ? window.SportsStationCart.formatRupiah(item.price * item.qty) : `Rp ${(item.price * item.qty).toLocaleString('id-ID')}`}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Footer & Actions -->
        <div class="order-card-footer">
          <div class="order-total-box">
            <span class="order-total-label">Total Pesanan:</span>
            <span class="order-total-amount">${formattedTotal}</span>
          </div>

          <div class="order-actions-group">
            <button class="order-btn-outline" onclick="openTrackingModal('${ord.id}')">
              <i class="fa-solid fa-route"></i> Lacak Pengiriman
            </button>
            <button class="order-btn-primary" onclick="reorderItems('${ord.id}')">
              <i class="fa-solid fa-rotate-right"></i> Beli Lagi
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function updateTabCounts(orders) {
  const counts = {
    semua: orders.length,
    'menunggu-pembayaran': orders.filter(o => o.status.toLowerCase().includes('menunggu')).length,
    diproses: orders.filter(o => o.status.toLowerCase().includes('proses') || o.status.toLowerCase().includes('diproses')).length,
    dikirim: orders.filter(o => o.status.toLowerCase().includes('kirim')).length,
    selesai: orders.filter(o => o.status.toLowerCase().includes('selesai')).length
  };

  Object.keys(counts).forEach(key => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = counts[key];
  });
}

function getStatusClass(status) {
  const s = status.toLowerCase();
  if (s.includes('menunggu')) return 'status-menunggu-pembayaran';
  if (s.includes('proses')) return 'status-diproses';
  if (s.includes('kirim')) return 'status-dikirim';
  if (s.includes('selesai')) return 'status-selesai';
  return 'status-diproses';
}

function copyText(txt) {
  navigator.clipboard.writeText(txt).then(() => {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast(`Nomor pesanan ${txt} disalin!`);
    } else {
      alert('Disalin: ' + txt);
    }
  });
}

function reorderItems(orderId) {
  const orders = getStoredOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || !window.SportsStationCart) return;

  order.items.forEach(it => {
    window.SportsStationCart.addToCart({
      id: it.id,
      name: it.name,
      price: it.price,
      image: it.image,
      size: it.size || '42',
      qty: it.qty || 1
    });
  });

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast('Produk ditambahkan ke keranjang belanja!');
  }

  setTimeout(() => {
    window.location.href = 'cart.html';
  }, 500);
}

function setupTrackingModal() {
  const modal = document.getElementById('trackingModal');
  const closeBtn = document.getElementById('trackingModalClose');

  if (modal && closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}

function openTrackingModal(orderId) {
  const orders = getStoredOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('trackingModal');
  if (!modal) return;

  document.getElementById('trackOrderId').textContent = order.id;
  document.getElementById('trackCourier').textContent = order.courier || 'Ekspedisi Pengiriman';
  document.getElementById('trackResi').textContent = order.trackingNumber || 'BITE-SS-749201';
  document.getElementById('trackDest').textContent = order.customer ? order.customer.address : 'Alamat Tujuan';

  // Render timeline dynamically according to current order status (Menunggu, Diproses, Dikirim, Selesai)
  renderTrackingTimeline(order);

  modal.style.display = 'flex';
}

function renderTrackingTimeline(order) {
  const container = document.getElementById('trackingTimelineContainer');
  if (!container) return;

  const s = (order.status || '').toLowerCase();
  const dateStr = order.displayDate || 'Hari ini';

  let step1Class = 'done';
  let step1Icon = '<i class="fa-solid fa-check"></i>';
  let step1Time = dateStr;

  let step2Class = '';
  let step2Icon = '<i class="fa-solid fa-box"></i>';
  let step2Time = 'Menunggu antrean gudang';

  let step3Class = '';
  let step3Icon = '<i class="fa-solid fa-truck"></i>';
  let step3Time = 'Estimasi pengiriman';

  let step4Class = '';
  let step4Icon = '<i class="fa-solid fa-location-dot"></i>';
  let step4Time = 'Estimasi 2 - 3 Hari';

  if (s.includes('menunggu')) {
    step1Class = 'active';
    step1Icon = '<i class="fa-regular fa-clock"></i>';
    step1Time = 'Menunggu konfirmasi pembayaran';
  } else if (s.includes('proses')) {
    step1Class = 'done';
    step2Class = 'active';
    step2Icon = '<i class="fa-solid fa-box-open"></i>';
    step2Time = 'Sedang diproses hari ini di Jakarta HQ';
    step3Time = 'Segera diserahkan ke kurir';
  } else if (s.includes('kirim')) {
    step1Class = 'done';
    step2Class = 'done';
    step2Icon = '<i class="fa-solid fa-check"></i>';
    step3Class = 'active';
    step3Icon = '<i class="fa-solid fa-truck-fast"></i>';
    step3Time = 'Dalam perjalanan bersama kurir';
  } else if (s.includes('selesai')) {
    step1Class = 'done';
    step2Class = 'done';
    step2Icon = '<i class="fa-solid fa-check"></i>';
    step3Class = 'done';
    step3Icon = '<i class="fa-solid fa-check"></i>';
    step4Class = 'done';
    step4Icon = '<i class="fa-solid fa-circle-check"></i>';
    step4Time = 'Pesanan Berhasil Diterima';
  } else if (s.includes('batal')) {
    step1Class = 'active';
    step1Icon = '<i class="fa-solid fa-xmark"></i>';
    step1Time = 'Pesanan Dibatalkan';
  }

  container.innerHTML = `
    <div class="timeline-step ${step1Class}">
      <div class="timeline-dot">${step1Icon}</div>
      <h4 class="timeline-title">Pesanan Diterima &amp; Diverifikasi</h4>
      <p class="timeline-desc">Pembayaran via Midtrans sukses dikonfirmasi oleh sistem Sports Station.</p>
      <span class="timeline-time">${step1Time}</span>
    </div>

    <div class="timeline-step ${step2Class}">
      <div class="timeline-dot">${step2Icon}</div>
      <h4 class="timeline-title">${s.includes('kirim') || s.includes('selesai') ? 'Selesai Dikemas di Warehouse Jakarta HQ' : 'Sedang Dikemas di Warehouse Jakarta HQ'}</h4>
      <p class="timeline-desc">Barang dipersiapkan dan diinspeksi kualitas di Sports Station Central Warehouse, Jakarta Pusat.</p>
      <span class="timeline-time">${step2Time}</span>
    </div>

    <div class="timeline-step ${step3Class}">
      <div class="timeline-dot">${step3Icon}</div>
      <h4 class="timeline-title">${s.includes('selesai') ? 'Telah Diantar oleh Kurir Ekspedisi' : 'Diserahkan ke Kurir Ekspedisi'}</h4>
      <p class="timeline-desc">${order.courier || 'Kurir Ekspedisi'} membawa paket menuju alamat penerima (Resi: ${order.trackingNumber || '-'}).</p>
      <span class="timeline-time">${step3Time}</span>
    </div>

    <div class="timeline-step ${step4Class}">
      <div class="timeline-dot">${step4Icon}</div>
      <h4 class="timeline-title">${s.includes('selesai') ? 'Paket Tiba di Alamat Tujuan (Selesai)' : 'Paket Tiba di Alamat Tujuan'}</h4>
      <p class="timeline-desc">${s.includes('selesai') ? 'Paket telah diterima dengan baik oleh pelanggan di alamat tujuan.' : 'Kurir mengantarkan pesanan langsung ke tangan Anda.'}</p>
      <span class="timeline-time">${step4Time}</span>
    </div>
  `;
}

// Global functions for inline HTML calls
window.copyText = copyText;
window.openTrackingModal = openTrackingModal;
window.renderTrackingTimeline = renderTrackingTimeline;
window.reorderItems = reorderItems;
