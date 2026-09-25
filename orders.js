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

  if (window.SportsStationDB && window.SportsStationDB.isConfigured()) {
    window.SportsStationDB.fetchOrders().then(() => {
      renderOrders();
    }).catch(err => console.warn('Could not sync orders from cloud', err));
  }

  // Real-time synchronization when orders are placed or updated across tabs
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
    const s = (ord.status || '').toLowerCase();
    if (currentTab === 'semua') return true;
    if (currentTab === 'terkonfirmasi' || currentTab === 'diproses') {
      return s.includes('terkonfirmasi') || s.includes('konfirmasi') || s.includes('proses');
    }
    if (currentTab === 'dikirim') return s.includes('kirim');
    if (currentTab === 'selesai') return s.includes('selesai');
    if (currentTab === 'dibatalkan') return s.includes('batal');
    return true;
  });

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(ord => {
      const matchId = ord.id.toLowerCase().includes(searchQuery);
      const matchItem = (ord.items || []).some(it => (it.name || '').toLowerCase().includes(searchQuery));
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
    const formattedTotal = window.SportsStationCart ? window.SportsStationCart.formatRupiah(ord.total) : `Rp ${Number(ord.total || 0).toLocaleString('id-ID')}`;
    const s = (ord.status || '').toLowerCase();
    const isShipped = s.includes('kirim');
    const isCompleted = s.includes('selesai');
    const isCancelled = s.includes('batal');
    const canCancel = (s.includes('terkonfirmasi') || s.includes('proses') || s.includes('menunggu')) && !isShipped && !isCompleted && !isCancelled;

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
          ${isShipped && ord.estimatedDeliveryDate ? `
            <div class="order-est-badge" style="font-size: 12px; color: #0284c7; font-weight: 500;">
              <i class="fa-solid fa-clock" style="color: #0284c7; margin-right: 4px;"></i> Estimasi Tiba: <strong>${ord.estimatedDeliveryDate}</strong>
            </div>
          ` : isCompleted ? `
            <div class="order-delivered-badge" style="font-size: 12px; color: #16a34a; font-weight: 600;">
              <i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> ${ord.deliveredBy || 'Paket Telah Diterima'}
            </div>
          ` : isCancelled ? `
            <div class="order-cancelled-badge" style="font-size: 12px; color: #dc2626; font-weight: 600;">
              <i class="fa-solid fa-circle-xmark" style="margin-right: 4px;"></i> Pesanan Dibatalkan
            </div>
          ` : `
            <div style="font-size: 11.5px; color: #64748b;">
              Pengiriman dari <strong>Sports Station Jakarta HQ</strong>
            </div>
          `}
        </div>

        <!-- Items list -->
        <div class="order-items-box">
          ${(ord.items || []).map(item => `
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
            ${canCancel ? `
              <button class="order-btn-cancel-cust" onclick="cancelOrderByCustomer('${ord.id}')" title="Batalkan pesanan sebelum diserahkan ke kurir">
                <i class="fa-solid fa-ban"></i> Batalkan Pesanan
              </button>
            ` : ''}

            ${isShipped ? `
              <button class="order-btn-received" onclick="confirmOrderReceived('${ord.id}')" title="Konfirmasi bahwa Anda telah menerima pesanan ini">
                <i class="fa-solid fa-circle-check"></i> Pesanan Diterima
              </button>
            ` : ''}

            <button class="order-btn-outline" onclick="openTrackingModal('${ord.id}')">
              <i class="fa-solid fa-route"></i> Lacak Pengiriman
            </button>

            ${(isCompleted || isCancelled) ? `
              <button class="order-btn-primary" onclick="reorderItems('${ord.id}')">
                <i class="fa-solid fa-rotate-right"></i> Beli Lagi
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function updateTabCounts(orders) {
  const terkonfirmasiCount = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s.includes('terkonfirmasi') || s.includes('konfirmasi') || s.includes('proses');
  }).length;

  const counts = {
    semua: orders.length,
    terkonfirmasi: terkonfirmasiCount,
    diproses: terkonfirmasiCount,
    dikirim: orders.filter(o => (o.status || '').toLowerCase().includes('kirim')).length,
    selesai: orders.filter(o => (o.status || '').toLowerCase().includes('selesai')).length,
    dibatalkan: orders.filter(o => (o.status || '').toLowerCase().includes('batal')).length
  };

  Object.keys(counts).forEach(key => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = counts[key];
  });
}

function getStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('menunggu')) return 'status-menunggu-pembayaran';
  if (s.includes('terkonfirmasi') || s.includes('konfirmasi')) return 'status-terkonfirmasi';
  if (s.includes('proses')) return 'status-diproses';
  if (s.includes('kirim')) return 'status-dikirim';
  if (s.includes('selesai')) return 'status-selesai';
  if (s.includes('batal')) return 'status-dibatalkan';
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

/**
 * Konfirmasi Pesanan Diterima oleh Customer
 */
function confirmOrderReceived(orderId) {
  const orders = getStoredOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (order.status !== 'Dikirim') {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('Pesanan tidak dalam status pengiriman.', 'warning');
    }
    return;
  }

  const ok = window.confirm(`Apakah Anda yakin telah menerima paket untuk pesanan ${orderId}?\n\nStatus pesanan akan diselesaikan.`);
  if (!ok) return;

  order.status = 'Selesai';
  order.deliveredAt = new Date().toISOString();
  order.deliveredBy = 'Konfirmasi Pelanggan';

  try {
    localStorage.setItem('SportsStationOrders', JSON.stringify(orders));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to update order status:', e);
  }

  if (window.SportsStationDB) {
    window.SportsStationDB.updateOrderStatus(orderId, 'Selesai');
  }

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`🎉 Terima kasih! Pesanan ${orderId} telah selesai diterima.`);
  }

  renderOrders();
}

/**
 * Batalkan Pesanan oleh Customer (hanya sebelum diserahkan ke kurir)
 */
function cancelOrderByCustomer(orderId) {
  const orders = getStoredOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const s = (order.status || '').toLowerCase();
  if (s.includes('kirim') || s.includes('selesai')) {
    alert('Pesanan sudah dalam proses pengiriman atau selesai, sehingga tidak dapat dibatalkan.');
    return;
  }

  const ok = window.confirm(`Apakah Anda yakin ingin membatalkan pesanan ${orderId}?\n\nPembatalan pesanan tidak dapat diurungkan.`);
  if (!ok) return;

  order.status = 'Dibatalkan';
  order.canceledAt = new Date().toISOString();
  order.canceledBy = 'Pelanggan';

  try {
    localStorage.setItem('SportsStationOrders', JSON.stringify(orders));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to cancel order:', e);
  }

  if (window.SportsStationDB) {
    window.SportsStationDB.updateOrderStatus(orderId, 'Dibatalkan');
  }

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`Pesanan ${orderId} berhasil dibatalkan.`);
  }

  renderOrders();
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
  document.getElementById('trackResi').textContent = order.trackingNumber || 'BITE-SS-' + order.id;
  document.getElementById('trackDest').textContent = order.customer ? order.customer.address : 'Alamat Tujuan';

  // Render timeline dynamically according to current order status
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
  let step3Time = order.shippedDisplayDate || 'Menunggu diserahkan ke kurir';

  let step4Class = '';
  let step4Icon = '<i class="fa-solid fa-location-dot"></i>';
  let step4Time = order.estimatedDeliveryDate ? `Estimasi Tiba: ${order.estimatedDeliveryDate}` : 'Estimasi 2 - 3 Hari';

  if (s.includes('menunggu')) {
    step1Class = 'active';
    step1Icon = '<i class="fa-regular fa-clock"></i>';
    step1Time = 'Menunggu konfirmasi pembayaran';
  } else if (s.includes('terkonfirmasi') || s.includes('proses')) {
    step1Class = 'done';
    step2Class = 'active';
    step2Icon = '<i class="fa-solid fa-box-open"></i>';
    step2Time = 'Pembayaran terkonfirmasi. Menunggu admin serahkan ke kurir.';
    step3Time = 'Segera diambil oleh kurir ekspedisi';
  } else if (s.includes('kirim')) {
    step1Class = 'done';
    step2Class = 'done';
    step2Icon = '<i class="fa-solid fa-check"></i>';
    step3Class = 'active';
    step3Icon = '<i class="fa-solid fa-truck-fast"></i>';
    step3Time = (order.shippedDisplayDate ? `Diserahkan: ${order.shippedDisplayDate}` : 'Dalam perjalanan') + ` | Resi: ${order.trackingNumber || '-'}`;
    step4Time = order.estimatedDeliveryDate ? `Estimasi Tiba: ${order.estimatedDeliveryDate}` : 'Estimasi 2 - 3 Hari';
  } else if (s.includes('selesai')) {
    step1Class = 'done';
    step2Class = 'done';
    step2Icon = '<i class="fa-solid fa-check"></i>';
    step3Class = 'done';
    step3Icon = '<i class="fa-solid fa-check"></i>';
    step4Class = 'done';
    step4Icon = '<i class="fa-solid fa-circle-check"></i>';
    step4Time = order.deliveredBy ? `Diterima (${order.deliveredBy})` : 'Pesanan Berhasil Diterima';
  } else if (s.includes('batal')) {
    step1Class = 'active';
    step1Icon = '<i class="fa-solid fa-xmark"></i>';
    step1Time = order.canceledAt ? `Dibatalkan pada ${new Date(order.canceledAt).toLocaleDateString('id-ID')}` : 'Pesanan Dibatalkan';
  }

  container.innerHTML = `
    <div class="timeline-step ${step1Class}">
      <div class="timeline-dot">${step1Icon}</div>
      <h4 class="timeline-title">${s.includes('batal') ? 'Pesanan Dibatalkan' : 'Pesanan Terkonfirmasi &amp; Lunas'}</h4>
      <p class="timeline-desc">${s.includes('batal') ? 'Pesanan ini telah dibatalkan atas permintaan pembeli/sistem.' : 'Pembayaran pesanan telah dikonfirmasi berhasil oleh sistem.'}</p>
      <span class="timeline-time">${step1Time}</span>
    </div>

    ${!s.includes('batal') ? `
      <div class="timeline-step ${step2Class}">
        <div class="timeline-dot">${step2Icon}</div>
        <h4 class="timeline-title">${s.includes('kirim') || s.includes('selesai') ? 'Selesai Dikemas di Warehouse Jakarta HQ' : 'Dipersiapkan di Warehouse Jakarta HQ'}</h4>
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
        <h4 class="timeline-title">${s.includes('selesai') ? 'Paket Diterima (Selesai)' : 'Penerimaan Paket oleh Pelanggan'}</h4>
        <p class="timeline-desc">${s.includes('selesai') ? 'Paket telah berhasil diterima dan diselesaikan oleh Anda.' : 'Kurir mengantarkan pesanan langsung ke tangan Anda. Konfirmasi dengan tombol "Pesanan Diterima" saat paket sampai.'}</p>
        <span class="timeline-time">${step4Time}</span>
      </div>
    ` : ''}
  `;
}

// Global functions for inline HTML calls
window.copyText = copyText;
window.openTrackingModal = openTrackingModal;
window.renderTrackingTimeline = renderTrackingTimeline;
window.reorderItems = reorderItems;
window.confirmOrderReceived = confirmOrderReceived;
window.cancelOrderByCustomer = cancelOrderByCustomer;

