/**
 * SPORTS STATION - ADMINISTRATOR DASHBOARD CONTROLLER
 * Handles Sales Overview, Orders Processing, Income/Financial History, and Stock Monitoring.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

let ordersData = [];
let catalogProducts = [];
let currentOrderFilter = 'semua';
let orderSearchTerm = '';
let financeSearchTerm = '';
let productSearchTerm = '';
let productCategoryFilter = '';
let productBrandFilter = '';
let productStockFilter = '';
let currentInvoiceOrder = null;

// Sound Notification State
let isSoundEnabled = localStorage.getItem('SportsStationAdminSound') !== 'false';
let knownOrderIds = new Set();
let isInitialOrderLoad = true;

/**
 * Web Audio API Synthesizer - Real-time Chime Notification
 */
function playOrderNotificationSound() {
  if (!isSoundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 4-note cheerful POS cashier / marketplace bell chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
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
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur + 0.05);
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

function toggleAdminSound() {
  isSoundEnabled = !isSoundEnabled;
  localStorage.setItem('SportsStationAdminSound', isSoundEnabled ? 'true' : 'false');
  updateSoundUI();
  if (isSoundEnabled) {
    playOrderNotificationSound();
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('🔔 Suara notifikasi pesanan masuk: DIAKTIFKAN');
    }
  } else {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('🔕 Suara notifikasi pesanan masuk: DINONAKTIFKAN');
    }
  }
}

function testAdminSound() {
  playOrderNotificationSound();
  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast('🔊 Memutar nada tes notifikasi pesanan masuk...');
  }
}

function updateSoundUI() {
  const btn = document.getElementById('adminSoundToggleBtn');
  const icon = document.getElementById('adminSoundIcon');
  const label = document.getElementById('adminSoundLabel');
  if (!btn || !icon || !label) return;

  if (isSoundEnabled) {
    btn.style.background = '#fff7ed';
    btn.style.borderColor = '#fdba74';
    btn.style.color = '#c2410c';
    icon.className = 'fa-solid fa-bell';
    label.textContent = 'Suara: Aktif';
  } else {
    btn.style.background = '#f1f5f9';
    btn.style.borderColor = '#cbd5e1';
    btn.style.color = '#64748b';
    icon.className = 'fa-solid fa-bell-slash';
    label.textContent = 'Suara: Mute';
  }
}

window.toggleAdminSound = toggleAdminSound;
window.testAdminSound = testAdminSound;

function initAdminDashboard() {
  checkAdminAuth();
  setupSidebarNavigation();
  updateDatabaseStatusUI();
  updateSoundUI();
  refreshAdminData();
  setupProductFilters();
  setupModals();
  setupLiveSync();

  // Polling sinkronisasi data pesanan secara halus tiap 2.5 detik
  setInterval(() => {
    loadOrdersFromStorage();
    renderSalesOverview();
    renderRecentOrdersOverview();
    renderOrdersTable();
    renderFinancialLedger();
  }, 2500);

  // Jika Supabase terhubung, sinkronkan data cloud secara asinkron
  if (window.SportsStationDB && window.SportsStationDB.isConfigured()) {
    syncFromSupabaseCloud();
  }
}

async function syncFromSupabaseCloud() {
  if (!window.SportsStationDB || !window.SportsStationDB.isConfigured()) return;
  try {
    const products = await window.SportsStationDB.fetchProducts();
    if (products && products.length > 0) {
      catalogProducts = products;
      renderProductsTable();
      renderSalesOverview();
    }
    const orders = await window.SportsStationDB.fetchOrders();
    if (orders && orders.length > 0) {
      ordersData = orders;
      renderOrdersTable();
      renderRecentOrdersOverview();
      renderFinancialLedger();
      renderSalesOverview();
    }
    updateDatabaseStatusUI();
  } catch (e) {
    console.warn('Gagal sync Supabase di admin:', e);
  }
}

function updateDatabaseStatusUI() {
  const isOnline = window.SportsStationDB && window.SportsStationDB.isConfigured();
  const dot = document.getElementById('dbStatusDot');
  const btn = document.getElementById('dbStatusBtn');
  if (dot) {
    dot.style.background = isOnline ? '#22c55e' : '#94a3b8';
    dot.title = isOnline ? 'Terhubung ke Supabase Cloud (PostgreSQL)' : 'Mode Standby / LocalStorage Fallback';
  }
  if (btn) {
    btn.style.borderColor = isOnline ? '#bbf7d0' : '#e2e8f0';
    btn.style.background = isOnline ? '#f0fdf4' : '#fff';
    btn.style.color = isOnline ? '#166534' : '#334155';
  }
}

function openDatabaseModal() {
  const modal = document.getElementById('databaseModal');
  if (!modal) return;
  const isOnline = window.SportsStationDB && window.SportsStationDB.isConfigured();
  const alertEl = document.getElementById('dbConnectionStatusAlert');
  const urlInput = document.getElementById('supabaseUrlInput');
  const keyInput = document.getElementById('supabaseKeyInput');

  if (urlInput) urlInput.value = localStorage.getItem('SUPABASE_URL') || '';
  if (keyInput) keyInput.value = localStorage.getItem('SUPABASE_ANON_KEY') || '';

  if (alertEl) {
    if (isOnline) {
      alertEl.style.background = '#dcfce7';
      alertEl.style.color = '#15803d';
      alertEl.style.border = '1px solid #bbf7d0';
      alertEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span><strong>Status: Terhubung ke Supabase Cloud</strong> - Data katalog & pesanan tersinkronisasi otomatis dengan PostgreSQL.</span>';
    } else {
      alertEl.style.background = '#fef3c7';
      alertEl.style.color = '#b45309';
      alertEl.style.border = '1px solid #fde68a';
      alertEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span><strong>Status: Standby / LocalStorage</strong> - Masukkan Project URL & Anon Key untuk menghubungkan Cloud.</span>';
    }
  }

  modal.style.display = 'flex';
}

function closeDatabaseModal() {
  const modal = document.getElementById('databaseModal');
  if (modal) modal.style.display = 'none';
}

async function saveDatabaseConfig() {
  const urlInput = document.getElementById('supabaseUrlInput');
  const keyInput = document.getElementById('supabaseKeyInput');
  const url = (urlInput ? urlInput.value : '').trim();
  const key = (keyInput ? keyInput.value : '').trim();

  if (url && !url.startsWith('https://')) {
    alert('URL Supabase harus diawali dengan https:// (contoh: https://xyz.supabase.co)');
    return;
  }

  if (url) {
    localStorage.setItem('SUPABASE_URL', url);
    if (window.SUPABASE_CONFIG) window.SUPABASE_CONFIG.url = url;
  } else {
    localStorage.removeItem('SUPABASE_URL');
  }

  if (key) {
    localStorage.setItem('SUPABASE_ANON_KEY', key);
    if (window.SUPABASE_CONFIG) window.SUPABASE_CONFIG.anonKey = key;
  } else {
    localStorage.removeItem('SUPABASE_ANON_KEY');
  }

  updateDatabaseStatusUI();
  closeDatabaseModal();

  if (window.SportsStationDB && window.SportsStationDB.isConfigured()) {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('✅ Berhasil terhubung ke Supabase Cloud! Menyinkronkan data...');
    }
    await syncFromSupabaseCloud();
  } else {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('ℹ️ Konfigurasi disimpan. Mode LocalStorage aktif.');
    }
  }
}

window.openDatabaseModal = openDatabaseModal;
window.closeDatabaseModal = closeDatabaseModal;
window.saveDatabaseConfig = saveDatabaseConfig;

function refreshAdminData() {
  loadOrdersFromStorage();
  loadCatalogProducts();
  renderSalesOverview();
  renderRecentOrdersOverview();
  renderOrdersTable();
  renderFinancialLedger();
  renderProductsTable();
}

window.refreshAdminData = refreshAdminData;

function setupLiveSync() {
  // Real-time synchronization across browser tabs and same-window actions
  window.addEventListener('storage', (e) => {
    // Abaikan event sintetis dari window sendiri untuk mencegah re-entry loop saat saveCatalogToStorage
    if (e && e.isTrusted === false) return;
    if (!e.key || e.key === 'SportsStationOrders' || e.key === 'SportsStationCatalog') {
      refreshAdminData();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshAdminData();
    }
  });
}

/**
 * 1. Admin Auth Guard
 */
function handleAdminLogout(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  sessionStorage.removeItem('sportsstation_admin_logged');
  localStorage.removeItem('sportsstation_user');
  if (window.SportsStationAuth && typeof window.SportsStationAuth.logout === 'function') {
    window.SportsStationAuth.logout();
  }
  window.location.href = 'login.html?logout=true';
}
window.handleAdminLogout = handleAdminLogout;

function checkAdminAuth() {
  const user = window.SportsStationAuth ? window.SportsStationAuth.getUser() : null;
  const isSessionAdmin = sessionStorage.getItem('sportsstation_admin_logged') === 'true';

  // Mark admin session in sessionStorage if logged in as admin
  if (user && user.role === 'admin') {
    sessionStorage.setItem('sportsstation_admin_logged', 'true');
  }

  // Bind Logout Button
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = handleAdminLogout;
  }
}

/**
 * 2. Sidebar View Switching
 */
function setupSidebarNavigation() {
  const navLinks = document.querySelectorAll('.admin-nav-link');
  const sections = document.querySelectorAll('.admin-view-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(sec => {
        if (sec.id === `view-${targetView}`) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // Always refresh latest data when switching tabs
      refreshAdminData();
    });
  });
}

/**
 * 3. Load & Synchronize Orders from Storage
 */
function loadOrdersFromStorage() {
  try {
    const raw = localStorage.getItem('SportsStationOrders');
    if (raw) {
      const parsed = JSON.parse(raw);
      const newOrders = Array.isArray(parsed) ? parsed : [];

      // Deteksi adanya orderan baru yang masuk untuk memutar bunyi notifikasi
      if (!isInitialOrderLoad && knownOrderIds.size > 0) {
        const newlyAdded = newOrders.filter(o => !knownOrderIds.has(o.id));
        if (newlyAdded.length > 0) {
          playOrderNotificationSound();
          const first = newlyAdded[0];
          const custName = first.customer ? first.customer.name : 'Pelanggan';
          if (window.SportsStationAuth) {
            window.SportsStationAuth.showToast(`🔔 Pesanan Baru Masuk! ${first.id} (${formatRupiah(first.total)}) dari ${custName}`);
          }
        }
      }

      ordersData = newOrders;
      knownOrderIds = new Set(ordersData.map(o => o.id));
      isInitialOrderLoad = false;
    } else {
      ordersData = [];
    }
  } catch (e) {
    console.error('Error loading SportsStationOrders:', e);
    ordersData = [];
  }
}

function saveOrdersToStorage() {
  localStorage.setItem('SportsStationOrders', JSON.stringify(ordersData));
  window.dispatchEvent(new Event('storage'));
}

/**
 * 4. Overview Penjualan & Statistik (100% Real Live Calculation - No Fake Seeds)
 */
function renderSalesOverview() {
  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let pendingProcessingCount = 0;
  const itemCounts = {};
  const categoryCounts = {};
  const courierCounts = {};

  // Track monthly revenue for the last 6 months
  const now = new Date();
  const monthsData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
    monthsData.push({ key: monthKey, label: monthLabel, revenue: 0 });
  }

  ordersData.forEach(ord => {
    const isCancelled = ord.status === 'Dibatalkan';
    const ordTotal = Number(ord.total || 0);

    if (!isCancelled) {
      totalRevenue += ordTotal;

      // Group into month
      const ordDate = ord.date ? new Date(ord.date) : now;
      const ordMonthKey = ordDate.getFullYear() + '-' + String(ordDate.getMonth() + 1).padStart(2, '0');
      const mMatch = monthsData.find(m => m.key === ordMonthKey);
      if (mMatch) {
        mMatch.revenue += ordTotal;
      } else if (monthsData.length > 0) {
        monthsData[monthsData.length - 1].revenue += ordTotal;
      }
    }

    const items = ord.items || [];
    items.forEach(it => {
      const q = Number(it.qty || 1);
      totalUnitsSold += q;

      // Track item frequency for best seller
      const itemName = it.name || 'Produk Sepatu';
      itemCounts[itemName] = (itemCounts[itemName] || 0) + q;

      // Track category
      let cat = 'Running Shoes';
      if (it.category) {
        cat = it.category;
      } else if (/running|lari|pegasus|zoom|adizero|ultraboost|floatride/i.test(itemName)) {
        cat = 'Running Shoes';
      } else if (/sneaker|casual|force|dunk|samba|gazelle|lifestyle|superstar/i.test(itemName)) {
        cat = 'Sneakers & Lifestyle';
      } else if (/training|gym|metcon|nano|crossfit/i.test(itemName)) {
        cat = 'Training & Gym';
      } else {
        cat = 'Apparel & Aksesoris';
      }
      categoryCounts[cat] = (categoryCounts[cat] || 0) + q;
    });

    // Pesanan yang perlu diproses / dipersiapkan di warehouse:
    // Status Terkonfirmasi (Sudah Bayar), Diproses, Menunggu Pembayaran, Baru, atau status yang belum selesai/dibatalkan
    const statusLower = (ord.status || '').toLowerCase();
    const isCompletedOrCancelled = statusLower.includes('selesai') || statusLower.includes('batal');
    if (!isCompletedOrCancelled) {
      pendingProcessingCount++;
    }

    // Track courier
    const cr = (ord.courier || 'JNE Reguler').split('(')[0].trim();
    courierCounts[cr] = (courierCounts[cr] || 0) + 1;
  });

  // Top metric cards
  const revEl = document.getElementById('statTotalRevenue');
  const ordEl = document.getElementById('statTotalOrders');
  const pendingEl = document.getElementById('statPendingOrders');
  const soldEl = document.getElementById('statUnitsSold');
  const badgeOrdEl = document.getElementById('sidebarOrdersBadge');
  const bestSellerEl = document.getElementById('statBestSeller');
  const revTrendEl = document.getElementById('statRevenueTrend');

  if (revEl) revEl.textContent = formatRupiah(totalRevenue);
  if (ordEl) ordEl.textContent = ordersData.length + ' Pesanan';
  if (pendingEl) pendingEl.textContent = pendingProcessingCount + ' Perlu Diproses';
  if (soldEl) soldEl.textContent = totalUnitsSold + ' Pasang';
  
  // Update badge di sidebar menu "Proses Pesanan"
  if (badgeOrdEl) {
    badgeOrdEl.textContent = pendingProcessingCount;
    badgeOrdEl.style.display = pendingProcessingCount > 0 ? 'inline-flex' : 'none';
  }

  // Best seller & trend text
  let bestSellerName = '-';
  let maxCount = 0;
  for (const [name, count] of Object.entries(itemCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestSellerName = name;
    }
  }
  if (bestSellerEl) {
    bestSellerEl.innerHTML = `<i class="fa-solid fa-fire"></i> Best Seller: ${bestSellerName}`;
  }
  if (revTrendEl) {
    revTrendEl.innerHTML = ordersData.length > 0 
      ? `<i class="fa-solid fa-arrow-trend-up"></i> ${ordersData.length} transaksi aktif via Midtrans`
      : `<i class="fa-solid fa-signal"></i> Menunggu transaksi pertama`;
  }

  // 1. Dynamic Monthly Bar Chart
  const chartEl = document.getElementById('adminMonthlyChart');
  if (chartEl) {
    const maxRev = Math.max(...monthsData.map(m => m.revenue), 1);
    chartEl.innerHTML = monthsData.map(m => {
      const pct = m.revenue > 0 ? Math.max(14, Math.round((m.revenue / maxRev) * 95)) : 5;
      const formattedVal = m.revenue > 0 ? formatRupiah(m.revenue) : 'Rp 0';
      return `
        <div class="chart-bar-col">
          <div class="chart-bar-fill" style="height: ${pct}%;" data-val="${formattedVal}"></div>
          <span class="chart-bar-label">${m.label}</span>
        </div>
      `;
    }).join('');
  }

  // 2. Dynamic Category Share
  const catEl = document.getElementById('adminCategoryBreakdown');
  if (catEl) {
    const totalCatUnits = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const catKeys = Object.keys(categoryCounts);
    if (totalCatUnits === 0 || catKeys.length === 0) {
      catEl.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 13px;">
          <i class="fa-solid fa-chart-pie" style="font-size: 26px; display: block; margin-bottom: 8px; color: #cbd5e1;"></i>
          Belum ada produk terjual dalam pesanan.
        </div>
      `;
    } else {
      const colors = ['#f95a00', '#2563eb', '#16a34a', '#9333ea', '#ea580c'];
      catEl.innerHTML = catKeys.map((cat, idx) => {
        const count = categoryCounts[cat];
        const pct = Math.round((count / totalCatUnits) * 100);
        const color = colors[idx % colors.length];
        return `
          <div class="category-stat-row">
            <div class="category-stat-info">
              <span>${cat}</span>
              <strong>${pct}% (${count} psg)</strong>
            </div>
            <div class="category-progress-bg">
              <div class="category-progress-fill" style="width: ${pct}%; background-color: ${color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 3. Dynamic Courier Breakdown
  const courierEl = document.getElementById('adminCourierBreakdown');
  if (courierEl) {
    const totalCouriers = Object.values(courierCounts).reduce((a, b) => a + b, 0);
    if (totalCouriers === 0) {
      courierEl.innerHTML = `<i class="fa-solid fa-truck" style="color: #f95a00; margin-right: 6px;"></i> Ekspedisi: Belum ada pesanan pengiriman.`;
    } else {
      const parts = Object.entries(courierCounts).map(([cr, cnt]) => {
        const pct = Math.round((cnt / totalCouriers) * 100);
        return `<strong>${cr} (${pct}%)</strong>`;
      });
      courierEl.innerHTML = `<i class="fa-solid fa-truck" style="color: #f95a00; margin-right: 6px;"></i> Ekspedisi Terfavorit: ${parts.join(' &bull; ')}`;
    }
  }
}

/**
 * 4.5. Overview - Recent Orders Preview
 */
function renderRecentOrdersOverview() {
  const tbody = document.getElementById('overviewRecentOrdersBody');
  if (!tbody) return;

  const recent = ordersData.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: #64748b;">
          <i class="fa-solid fa-box-open" style="font-size: 26px; color: #cbd5e1; display: block; margin-bottom: 8px;"></i>
          Belum ada pesanan masuk. Saat pelanggan melakukan pemesanan, data akan langsung sinkron otomatis di sini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recent.map(ord => {
    const statusClass = getStatusBadgeClass(ord.status);
    const custName = ord.customer ? ord.customer.name : 'Pelanggan';
    const itemsSummary = (ord.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');

    return `
      <tr>
        <td>
          <strong style="color: #0f172a; font-family: 'Montserrat', sans-serif;">${ord.id}</strong>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${ord.displayDate || ord.date}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: #0f172a;">${custName}</div>
          <div style="font-size: 11px; color: #64748b;">${ord.customer ? ord.customer.phone : '-'}</div>
        </td>
        <td>
          <div style="max-width: 220px; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsSummary}">
            ${itemsSummary}
          </div>
          <span style="font-size: 11px; color: #f95a00; font-weight: 500;">${ord.items ? ord.items.length : 1} Produk</span>
        </td>
        <td>
          <div style="font-weight: 500; color: #334155;">${ord.courier || 'Ekspedisi'}</div>
          <div style="font-size: 11px; font-family: monospace; color: #64748b;">${ord.trackingNumber || '-'}</div>
        </td>
        <td>
          <strong style="color: #0f172a;">${formatRupiah(ord.total)}</strong>
        </td>
        <td>
          <span class="order-badge-pill ${statusClass}">
            <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${ord.status}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="admin-btn-action" onclick="openInvoiceModal('${ord.id}')" title="Cetak &amp; Download Invoice" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
              <i class="fa-solid fa-receipt"></i> Invoice
            </button>
            <button class="admin-btn-action" onclick="document.querySelector('[data-view=orders]').click();" title="Buka Detail di Proses Pesanan">
              <i class="fa-solid fa-arrow-right"></i> Proses
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 5. Proses Pesanan (Live Management)
 */
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  // Filter tabs
  const filterBtns = document.querySelectorAll('.admin-filter-btn');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.getAttribute('data-status') || 'semua';
      renderOrdersTable();
    };
  });

  // Search input
  const searchInput = document.getElementById('adminOrderSearch');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', (e) => {
      orderSearchTerm = e.target.value.toLowerCase().trim();
      renderOrdersTable();
    });
  }

  let filtered = ordersData.filter(ord => {
    const s = (ord.status || '').toLowerCase();
    if (currentOrderFilter === 'semua') return true;
    if (currentOrderFilter === 'terkonfirmasi') return s.includes('terkonfirmasi') || s.includes('konfirmasi') || s.includes('proses');
    if (currentOrderFilter === 'dikirim') return s.includes('kirim');
    if (currentOrderFilter === 'selesai') return s.includes('selesai');
    if (currentOrderFilter === 'dibatalkan') return s.includes('batal');
    return true;
  });

  if (orderSearchTerm) {
    filtered = filtered.filter(ord => {
      const matchId = ord.id.toLowerCase().includes(orderSearchTerm);
      const matchCust = ord.customer && ord.customer.name.toLowerCase().includes(orderSearchTerm);
      const matchItem = ord.items && ord.items.some(i => i.name.toLowerCase().includes(orderSearchTerm));
      return matchId || matchCust || matchItem;
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-box-open" style="font-size: 28px; margin-bottom: 8px; display: block; color: #cbd5e1;"></i>
          Tidak ada data pesanan yang sesuai filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(ord => {
    const statusClass = getStatusBadgeClass(ord.status);
    const custName = ord.customer ? ord.customer.name : 'Pelanggan';
    const custPhone = ord.customer ? ord.customer.phone : '-';
    const itemsSummary = (ord.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
    const isHandoverReady = ord.status === 'Terkonfirmasi' || ord.status === 'Diproses';

    return `
      <tr>
        <td>
          <strong style="color: #0f172a; font-family: 'Montserrat', sans-serif;">${ord.id}</strong>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${ord.displayDate || ord.date}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: #0f172a;">${custName}</div>
          <div style="font-size: 11px; color: #64748b;">${custPhone}</div>
        </td>
        <td>
          <div style="max-width: 240px; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsSummary}">
            ${itemsSummary}
          </div>
          <span style="font-size: 11px; color: #f95a00; font-weight: 500;">${ord.items ? ord.items.length : 1} Produk</span>
        </td>
        <td>
          <div style="font-weight: 500; color: #334155;">${ord.courier || 'Ekspedisi'}</div>
          <div style="font-size: 11px; font-family: monospace; color: #64748b;">${ord.trackingNumber || '-'}</div>
        </td>
        <td>
          <strong style="color: #0f172a;">${formatRupiah(ord.total)}</strong>
        </td>
        <td>
          <span class="order-badge-pill ${statusClass}">
            <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${ord.status}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            ${isHandoverReady ? `
              <button class="admin-btn-handover" onclick="handoverToCourier('${ord.id}')" title="Kirim Paket Langsung ke Kurir">
                <i class="fa-solid fa-truck-fast"></i> Kirim Langsung
              </button>
            ` : ''}
            <select class="admin-action-select" onchange="updateOrderStatus('${ord.id}', this.value)" title="Ubah Status Pesanan">
              <option value="Terkonfirmasi" ${ord.status === 'Terkonfirmasi' ? 'selected' : ''}>Terkonfirmasi (Sudah Bayar)</option>
              <option value="Dikirim" ${ord.status === 'Dikirim' ? 'selected' : ''}>Dikirim (Kurir)</option>
              <option value="Dibatalkan" ${ord.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
              ${ord.status === 'Selesai' ? '<option value="Selesai" selected disabled>Selesai (Diterima Customer)</option>' : ''}
            </select>
            <button class="admin-btn-action" onclick="openOrderDetailModal('${ord.id}')" title="Lihat Rincian Pesanan">
              <i class="fa-solid fa-eye"></i> Detail
            </button>
            <button class="admin-btn-action" onclick="openInvoiceModal('${ord.id}')" title="Cetak / Download Invoice" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
              <i class="fa-solid fa-receipt"></i> Invoice
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateOrderStatus(orderId, newStatus) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  if (newStatus === 'Selesai') {
    alert('Hanya pembeli/pelanggan yang berhak menyelesaikan pesanan setelah mereka menerima paket.');
    renderOrdersTable();
    return;
  }

  order.status = newStatus;
  
  // If moving to Dikirim and tracking number is empty, auto-generate one
  if (newStatus === 'Dikirim' && (!order.trackingNumber || order.trackingNumber === '-')) {
    order.trackingNumber = 'BITE-SS-' + Math.floor(10000000 + Math.random() * 90000000);
  }

  saveOrdersToStorage();
  if (window.SportsStationDB) {
    window.SportsStationDB.updateOrderStatus(orderId, newStatus);
  }
  renderSalesOverview();
  renderRecentOrdersOverview();
  renderOrdersTable();
  renderFinancialLedger();

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`Status pesanan ${orderId} berhasil diubah ke: ${newStatus}`);
  }
}

function handoverToCourier(orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  // Auto-generate resi resmi jika belum ada
  if (!order.trackingNumber || order.trackingNumber === '-' || order.trackingNumber.startsWith('SS-ORD-') || order.trackingNumber.startsWith('BITE-SS-')) {
    const courierCode = (order.courier || 'JNE').split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase() || 'JNE';
    order.trackingNumber = `BITE-${courierCode}-${Math.floor(10000000 + Math.random() * 90000000)}`;
  }

  order.status = 'Dikirim';
  order.shippedAt = new Date().toISOString();
  order.shippedDisplayDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Hitung estimasi waktu sampai kurir (default 2-3 hari)
  let estDays = 2;
  const cName = (order.courier || '').toLowerCase();
  if (cName.includes('1-2')) estDays = 2;
  else if (cName.includes('2-3')) estDays = 3;
  else if (cName.includes('3-5')) estDays = 4;
  else if (cName.includes('same day') || cName.includes('instant')) estDays = 1;

  const estDate = new Date(Date.now() + estDays * 24 * 60 * 60 * 1000);
  order.estimatedDeliveryDate = estDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  order.estimatedDeliveryTimestamp = estDate.getTime();

  saveOrdersToStorage();
  if (window.SportsStationDB) {
    window.SportsStationDB.updateOrderStatus(orderId, 'Dikirim');
  }

  renderSalesOverview();
  renderRecentOrdersOverview();
  renderOrdersTable();
  renderFinancialLedger();

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`🚚 Paket pesanan ${orderId} telah diserahkan ke ${order.courier || 'Kurir'}! Nomor Resi: ${order.trackingNumber}`);
  }
}

/**
 * 6. Riwayat Pemasukan (Financial Ledger)
 */
function renderFinancialLedger() {
  const tbody = document.getElementById('financialTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('adminFinanceSearch');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', (e) => {
      financeSearchTerm = e.target.value.toLowerCase().trim();
      renderFinancialLedger();
    });
  }

  let filtered = [...ordersData];

  if (financeSearchTerm) {
    filtered = filtered.filter(ord => {
      const matchId = ord.id.toLowerCase().includes(financeSearchTerm);
      const matchCust = ord.customer && ord.customer.name.toLowerCase().includes(financeSearchTerm);
      const matchMethod = ord.paymentMethod && ord.paymentMethod.toLowerCase().includes(financeSearchTerm);
      return matchId || matchCust || matchMethod;
    });
  }

  tbody.innerHTML = filtered.map(ord => {
    const custName = ord.customer ? ord.customer.name : 'Pelanggan';
    const subtotal = (ord.total || 0) - (ord.shippingFee || ord.courierPrice || 0);

    return `
      <tr>
        <td>
          <strong style="color: #0f172a; font-family: monospace;">${ord.id}</strong>
        </td>
        <td>
          <span style="color: #475569; font-size: 12px;">${ord.displayDate || ord.date}</span>
        </td>
        <td>
          <strong style="color: #0f172a;">${custName}</strong>
        </td>
        <td>
          <span style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 500; color: #334155;">
            <i class="fa-solid fa-credit-card" style="color: #f95a00; margin-right: 4px;"></i>
            ${ord.paymentMethod || 'Midtrans Gateway'}
          </span>
        </td>
        <td>
          <span style="color: #64748b;">${formatRupiah(subtotal)}</span>
        </td>
        <td>
          <span style="color: #64748b;">${formatRupiah(ord.shippingFee || ord.courierPrice || 12000)}</span>
        </td>
        <td>
          <strong style="color: #16a34a; font-size: 14px;">${formatRupiah(ord.total)}</strong>
        </td>
        <td>
          <span class="order-badge-pill status-selesai" style="background-color: #f0fdf4; color: #16a34a;">
            <i class="fa-solid fa-check"></i> Settlement (Lunas)
          </span>
        </td>
        <td>
          <button class="admin-btn-action" onclick="openInvoiceModal('${ord.id}')" title="Cetak / Unduh Invoice" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0;">
            <i class="fa-solid fa-receipt"></i> Invoice
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 7. Order Details Modal & Invoice System
 */
function setupModals() {
  const detailModal = document.getElementById('adminDetailModal');
  const closeBtn = document.getElementById('adminModalClose');
  const closeBtnFooter = document.getElementById('adminModalCloseBtn');

  const closeModal = () => {
    if (detailModal) detailModal.style.display = 'none';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBtnFooter) closeBtnFooter.addEventListener('click', closeModal);

  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeModal();
    });
  }
}

function openOrderDetailModal(orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('adminDetailModal');
  if (!modal) return;

  document.getElementById('modalDetailOrderId').textContent = order.id;
  document.getElementById('modalDetailDate').textContent = order.displayDate || order.date;
  document.getElementById('modalDetailCustomer').textContent = order.customer ? `${order.customer.name} (${order.customer.phone})` : '-';
  document.getElementById('modalDetailAddress').textContent = order.customer ? order.customer.address : '-';
  document.getElementById('modalDetailCourier').textContent = `${order.courier || 'Ekspedisi'} (Resi: ${order.trackingNumber || 'Belum Digenerate'})`;
  document.getElementById('modalDetailPayment').textContent = order.paymentMethod || 'Midtrans Gateway';

  const itemsList = document.getElementById('modalDetailItems');
  if (itemsList && order.items) {
    itemsList.innerHTML = order.items.map(it => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${it.image}" alt="${it.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" onerror="this.src='Asset/Logo/logo.png'">
          <div>
            <div style="font-weight: 500; font-size: 13px; color: #0f172a;">${it.name}</div>
            <div style="font-size: 11.5px; color: #64748b;">Ukuran: ${it.size || '-'} | Qty: ${it.qty}x</div>
          </div>
        </div>
        <div style="font-weight: 600; font-size: 13px; color: #0f172a;">
          ${formatRupiah(it.price * it.qty)}
        </div>
      </div>
    `).join('');
  }

  document.getElementById('modalDetailTotal').textContent = formatRupiah(order.total);

  const handoverBtn = document.getElementById('modalDetailHandoverBtn');
  if (handoverBtn) {
    if (order.status === 'Terkonfirmasi' || order.status === 'Diproses') {
      handoverBtn.style.display = 'inline-flex';
      handoverBtn.onclick = () => {
        handoverToCourier(order.id);
        modal.style.display = 'none';
      };
    } else {
      handoverBtn.style.display = 'none';
      handoverBtn.onclick = null;
    }
  }

  const invoiceBtn = document.getElementById('modalDetailInvoiceBtn');
  if (invoiceBtn) {
    invoiceBtn.onclick = () => openInvoiceModal(order.id);
  }

  modal.style.display = 'flex';
}

/**
 * GENERATE OFFICIAL INVOICE HTML
 */
function buildInvoiceHtml(order) {
  const subtotal = (order.total || 0) - (order.shippingFee || order.courierPrice || 0);
  const itemsRows = (order.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
        <strong style="color: #0f172a; font-size: 13px;">${it.name}</strong>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Ukuran: <strong>${it.size || 'All Size'}</strong> &bull; SKU: SS-${it.id || 'ITEM'}</div>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${it.qty}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">${formatRupiah(it.price)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">${formatRupiah(it.price * it.qty)}</td>
    </tr>
  `).join('');

  return `
    <div class="invoice-card-paper">
      <!-- Kop Header -->
      <div class="invoice-header-row">
        <div>
          <img src="Asset/Logo/logo.png" alt="Sports Station" class="invoice-brand-logo" onerror="this.src='Asset/Logo/logo.png'">
          <div class="invoice-company-info">
            <strong>PT MAP AKTIF ADIPERKASA TBK (SPORTS STATION)</strong><br>
            Central Fulfillment &amp; Operations: Sahid Sudirman Center Lt. 28, Jakarta Pusat 10220<br>
            Email: customer@sportsstation.id &bull; Hotline: 1500-777
          </div>
        </div>
        <div style="text-align: right;">
          <h2 class="invoice-main-title">FAKTUR PENJUALAN</h2>
          <div style="font-size: 12.5px; color: #64748b; margin-bottom: 6px;">No. Invoice: <strong style="color: #0f172a; font-family: monospace;">INV/SS/${order.id.replace('SS-ORD-', '')}</strong></div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Tanggal: <strong>${order.displayDate || order.date}</strong></div>
          <div><span class="invoice-status-stamp"><i class="fa-solid fa-circle-check"></i> LUNAS / PAID</span></div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="invoice-details-grid">
        <div class="invoice-details-col">
          <h4><i class="fa-solid fa-user" style="color: #f95a00;"></i> Informasi Pembeli / Penerima</h4>
          <div style="font-weight: 700; color: #0f172a; font-size: 13.5px; margin-bottom: 2px;">${order.customer ? order.customer.name : 'Pelanggan'}</div>
          <div style="color: #475569; margin-bottom: 4px;"><i class="fa-solid fa-phone" style="font-size: 10px;"></i> ${order.customer ? order.customer.phone : '-'} &bull; ${order.customer ? order.customer.email : '-'}</div>
          <div style="color: #334155; line-height: 1.4;"><i class="fa-solid fa-location-dot" style="font-size: 10px;"></i> ${order.customer ? order.customer.address : '-'}</div>
        </div>
        <div class="invoice-details-col">
          <h4><i class="fa-solid fa-truck" style="color: #2563eb;"></i> Pengiriman &amp; Pembayaran</h4>
          <div>Ekspedisi: <strong>${order.courier || 'JNE Reguler'}</strong></div>
          <div>Nomor Resi: <strong style="font-family: monospace; color: #2563eb;">${order.trackingNumber || '-'}</strong></div>
          <div>Metode Bayar: <strong>${order.paymentMethod || 'Midtrans Payment Gateway'}</strong></div>
          <div>Nomor Transaksi/VA: <strong style="font-family: monospace;">${order.vaNumber || order.id}</strong></div>
        </div>
      </div>

      <!-- Table of items -->
      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">No</th>
            <th>Rincian Produk</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 140px; text-align: right;">Harga Satuan</th>
            <th style="width: 150px; text-align: right;">Jumlah (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Calculations -->
      <div class="invoice-calc-box">
        <div class="invoice-calc-table">
          <div class="invoice-calc-row">
            <span>Subtotal Produk:</span>
            <strong>${formatRupiah(subtotal)}</strong>
          </div>
          <div class="invoice-calc-row">
            <span>Biaya Pengiriman (Biteship):</span>
            <strong>${formatRupiah(order.shippingFee || order.courierPrice || 0)}</strong>
          </div>
          <div class="invoice-calc-row total-row">
            <span>TOTAL PEMBAYARAN:</span>
            <span style="color: #f95a00;">${formatRupiah(order.total)}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="invoice-footer-note">
        <div style="font-weight: 600; color: #475569; margin-bottom: 2px;">
          ✓ Garansi 100% Produk Original Sports Station Resmi Indonesia
        </div>
        Dokumen ini sah dan diterbitkan secara digital oleh Sports Station Central Management System.<br>
        Terima kasih atas kepercayaan Anda berbelanja perlengkapan olahraga di Sports Station.
      </div>
    </div>
  `;
}

function openInvoiceModal(orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  currentInvoiceOrder = order;
  const modal = document.getElementById('adminInvoiceModal');
  const content = document.getElementById('invoiceModalContent');

  if (modal && content) {
    content.innerHTML = buildInvoiceHtml(order);
    modal.style.display = 'flex';
  }
}

function closeInvoiceModal() {
  const modal = document.getElementById('adminInvoiceModal');
  if (modal) modal.style.display = 'none';
}

function printCurrentInvoice() {
  if (!currentInvoiceOrder) return;
  const printWindow = window.open('', '_blank', 'width=880,height=900');
  if (!printWindow) {
    window.print();
    return;
  }

  const invoiceHtml = buildInvoiceHtml(currentInvoiceOrder);
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>INVOICE_${currentInvoiceOrder.id}_SPORTS_STATION</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
      <style>
        body { font-family: 'Inter', sans-serif; padding: 36px; background: #fff; color: #0f172a; margin: 0; }
        .invoice-card-paper { width: 100%; max-width: 800px; margin: 0 auto; }
        .invoice-header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #f95a00; padding-bottom: 18px; margin-bottom: 20px; }
        .invoice-brand-logo { height: 36px; margin-bottom: 6px; }
        .invoice-company-info { font-size: 11.5px; color: #64748b; line-height: 1.4; }
        .invoice-main-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0 0 4px; font-family: 'Montserrat', sans-serif; }
        .invoice-status-stamp { display: inline-block; background-color: #dcfce7; color: #15803d; border: 1.5px solid #86efac; padding: 3px 12px; border-radius: 4px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; }
        .invoice-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 12.5px; }
        .invoice-details-col h4 { margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .invoice-table th { background-color: #f1f5f9; color: #334155; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #cbd5e1; }
        .invoice-table td { padding: 10px 12px; font-size: 12.5px; border-bottom: 1px solid #f1f5f9; }
        .invoice-calc-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
        .invoice-calc-table { width: 320px; }
        .invoice-calc-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12.5px; color: #475569; }
        .invoice-calc-row.total-row { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #0f172a; }
        .invoice-footer-note { border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${invoiceHtml}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadCurrentInvoice() {
  if (!currentInvoiceOrder) return;
  const invoiceHtml = buildInvoiceHtml(currentInvoiceOrder);
  const fullHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${currentInvoiceOrder.id} - Sports Station</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    body { font-family: 'Inter', sans-serif; padding: 36px; background: #f8fafc; color: #0f172a; margin: 0; display: flex; justify-content: center; }
    .invoice-card-paper { width: 100%; max-width: 800px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .invoice-header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #f95a00; padding-bottom: 18px; margin-bottom: 20px; }
    .invoice-brand-logo { height: 36px; margin-bottom: 6px; }
    .invoice-company-info { font-size: 11.5px; color: #64748b; line-height: 1.4; }
    .invoice-main-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0 0 4px; font-family: 'Montserrat', sans-serif; }
    .invoice-status-stamp { display: inline-block; background-color: #dcfce7; color: #15803d; border: 1.5px solid #86efac; padding: 3px 12px; border-radius: 4px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; }
    .invoice-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 12.5px; }
    .invoice-details-col h4 { margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .invoice-table th { background-color: #f1f5f9; color: #334155; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #cbd5e1; }
    .invoice-table td { padding: 10px 12px; font-size: 12.5px; border-bottom: 1px solid #f1f5f9; }
    .invoice-calc-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .invoice-calc-table { width: 320px; }
    .invoice-calc-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12.5px; color: #475569; }
    .invoice-calc-row.total-row { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .invoice-footer-note { border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  ${invoiceHtml}
</body>
</html>
  `;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${currentInvoiceOrder.id}_SportsStation.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`📄 Invoice ${currentInvoiceOrder.id} berhasil diunduh!`);
  }
}

window.openInvoiceModal = openInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.printCurrentInvoice = printCurrentInvoice;
window.downloadCurrentInvoice = downloadCurrentInvoice;
window.printInvoice = openInvoiceModal;

/**
 * Helper: Format Rupiah
 */
function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function getStatusBadgeClass(status) {
  const s = String(status).toLowerCase();
  if (s.includes('menunggu')) return 'status-menunggu-pembayaran';
  if (s.includes('terkonfirmasi') || s.includes('konfirmasi')) return 'status-terkonfirmasi';
  if (s.includes('proses')) return 'status-diproses';
  if (s.includes('kirim')) return 'status-dikirim';
  if (s.includes('selesai')) return 'status-selesai';
  if (s.includes('batal')) return 'status-dibatalkan';
  return 'status-diproses';
}

// Global exposes for inline clicks
window.updateOrderStatus = updateOrderStatus;
window.handoverToCourier = handoverToCourier;
window.openOrderDetailModal = openOrderDetailModal;
window.printInvoice = printInvoice;

/**
 * ============================================================================
 * 8. KATALOG & MANAJEMEN STOK PRODUK PER SIZE (CRUD LENGKAP)
 * ============================================================================
 */
let currentModalSizeStock = {};
let quickSizeEditingProductId = null;
let quickSizeTempStock = {};

function getDefaultSizesForCategory(category) {
  const cat = (category || '').toLowerCase();
  if (['running', 'lifestyle', 'basketball', 'football', 'training', 'badminton', 'tennis', 'sandals'].includes(cat)) {
    return { '38': 4, '39': 8, '40': 10, '41': 12, '42': 10, '43': 7, '44': 4, '45': 2 };
  } else if (['tshirt', 'shorts', 'pants', 'sports-bra', 'jacket', 'tanktop', 'swimwear'].includes(cat)) {
    return { 'S': 8, 'M': 15, 'L': 12, 'XL': 8, 'XXL': 4 };
  } else {
    return { 'All Size': 25 };
  }
}

const DEFAULT_CATALOG = [
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
    stock: 48,
    sizeStock: { '39': 6, '40': 10, '41': 14, '42': 12, '43': 4, '44': 2 },
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
    stock: 35,
    sizeStock: { '39': 5, '40': 8, '41': 10, '42': 8, '43': 4 },
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
    stock: 14,
    sizeStock: { '40': 3, '41': 6, '42': 4, '43': 1 },
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
    stock: 10,
    sizeStock: { '39': 2, '40': 4, '41': 3, '42': 1 },
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
    stock: 18,
    sizeStock: { '40': 4, '41': 6, '42': 5, '43': 3 },
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
    stock: 32,
    sizeStock: { '36': 4, '37': 8, '38': 10, '39': 6, '40': 4 },
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
    stock: 16,
    sizeStock: { '36': 2, '37': 4, '38': 6, '39': 3, '40': 1 },
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
    stock: 24,
    sizeStock: { '36': 3, '37': 6, '38': 8, '39': 5, '40': 2 },
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
    stock: 45,
    sizeStock: { '39': 8, '40': 12, '41': 14, '42': 8, '43': 3 },
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
    stock: 20,
    sizeStock: { '40': 4, '41': 6, '42': 6, '43': 4 },
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
    stock: 36,
    sizeStock: { 'XS': 4, 'S': 10, 'M': 12, 'L': 7, 'XL': 3 },
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/c8a7e9f1-2d3b-4e5f-a6c7-8d9e0f1a2b3c/NIKE+PRO+DRI-FIT+SWOOSH.png'
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
    stock: 40,
    sizeStock: { 'S': 8, 'M': 14, 'L': 12, 'XL': 6 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/a1b2c3d4-e5f6-7890-abcd-ef1234567890/NIKE+DRI-FIT+CHALLENGER.png'
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
    stock: 22,
    sizeStock: { 'S': 4, 'M': 8, 'L': 7, 'XL': 3 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b2c3d4e5-f6a7-8901-bcde-f12345678901/NIKE+CLUB+FLEECE+FZ.png'
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
    stock: 25,
    sizeStock: { 'All Size': 25 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/c3d4e5f6-a7b8-9012-cdef-123456789012/NIKE+HERITAGE+BACKPACK.png'
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
    stock: 45,
    sizeStock: { 'M': 20, 'L': 25 },
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/d4e5f6a7-b8c9-0123-defa-234567890123/NIKE+EVERYDAY+SOCKS.png'
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
    stock: 28,
    sizeStock: { '36': 4, '37': 8, '38': 8, '39': 5, '40': 3 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/104537_GRY.jpg'
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
    stock: 22,
    sizeStock: { '36': 3, '37': 6, '38': 7, '39': 4, '40': 2 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/119776_BKW.jpg'
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
    stock: 30,
    sizeStock: { '36': 4, '37': 8, '38': 10, '39': 6, '40': 2 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/117379_TPE.jpg'
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
    stock: 35,
    sizeStock: { '39': 4, '40': 8, '41': 12, '42': 8, '43': 3 },
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/216281_BKW.jpg'
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
    stock: 25,
    sizeStock: { '30': 4, '31': 5, '32': 6, '33': 6, '34': 4 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/303560L_BKMT.jpg'
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
    stock: 30,
    sizeStock: { 'All Size': 30 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/SKCH7680_CHAR.jpg'
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
    stock: 60,
    sizeStock: { 'M': 30, 'L': 30 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://img.skechers.com/img/productimages/large/S115259_WBK.jpg'
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
    stock: 26,
    sizeStock: { '39': 4, '40': 7, '41': 8, '42': 5, '43': 2 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://assets.adidas.com/images/w_600,f_auto,q_auto/832df7895ce244888dc9af3800fe0cf7/Sepatu_Treadmove_Hitam_JI1147_01_standard.jpg'
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
    stock: 30,
    sizeStock: { '40': 6, '41': 10, '42': 10, '43': 4 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://assets.adidas.com/images/w_600,f_auto,q_auto/7f8c0e4c5c3b4a2d9e1f/Sepatu_Switch_Move_Hitam_IF5765_01_standard.jpg'
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
    stock: 28,
    sizeStock: { '36': 4, '37': 7, '38': 9, '39': 5, '40': 3 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://assets.adidas.com/images/w_600,f_auto,q_auto/a2b3c4d5e6f70819/Sepatu_Runfalcon_5_Hitam_IE8817_01_standard.jpg'
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
    stock: 32,
    sizeStock: { 'S': 6, 'M': 12, 'L': 10, 'XL': 4 },
    isSale: false,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'https://assets.adidas.com/images/w_600,f_auto,q_auto/d9e8f7a6b5c4d3e2/Celana_Tiro_24_Training_Hitam_IJ9958_21_model.jpg'
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
    stock: 40,
    sizeStock: { 'S': 8, 'M': 16, 'L': 12, 'XL': 4 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://assets.adidas.com/images/w_600,f_auto,q_auto/e1f2a3b4c5d6e7f8/Tee_Katun_Essentials_3-Stripes_Putih_JD9929_01_laydown.jpg'
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
    stock: 20,
    sizeStock: { '39': 3, '40': 6, '41': 6, '42': 4, '43': 1 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600/global/378960/01/sv01/fnd/SEA/fmt/png/INTERFLEX-Modern-Running-Shoes'
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
    stock: 18,
    sizeStock: { '40': 4, '41': 6, '42': 5, '43': 3 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600/global/310635/01/sv01/fnd/SEA/fmt/png/Softride-Clean-v2-Running-Shoes'
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
    stock: 25,
    sizeStock: { '40': 5, '41': 8, '42': 8, '43': 4 },
    isSale: true,
    tag: 'HOT',
    createdAt: new Date().toISOString(),
    image: 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600/global/379928/02/sv01/fnd/SEA/fmt/png/Flyer-Lite-3-Running-Shoes'
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
    stock: 50,
    sizeStock: { 'S': 10, 'M': 18, 'L': 14, 'XL': 8 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600/global/680178/01/sv01/fnd/SEA/fmt/png/Classics-Logo-Tee'
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
    stock: 40,
    sizeStock: { 'All Size': 40 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600/global/054156/01/sv01/fnd/SEA/fmt/png/PUMA-TR-Training-Bottle'
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
    stock: 22,
    sizeStock: { '39': 3, '40': 6, '41': 7, '42': 4, '43': 2 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://nb.scene7.com/is/image/NB/m460lb4_nb_02_i?$pdpflexf2$&qlt=80&wid=600'
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
    stock: 26,
    sizeStock: { '36': 3, '37': 7, '38': 8, '39': 5, '40': 3 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://nb.scene7.com/is/image/NB/w411lg4_nb_02_i?$pdpflexf2$&qlt=80&wid=600'
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
    stock: 16,
    sizeStock: { '40': 3, '41': 6, '42': 5, '43': 2 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://nb.scene7.com/is/image/NB/mtektrc1_nb_02_i?$pdpflexf2$&qlt=80&wid=600'
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
    stock: 20,
    sizeStock: { '39': 2, '40': 6, '41': 7, '42': 4, '43': 1 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://assets.reebok.com/images/w_600,f_auto,q_auto/a1b2c3d4e5f67890abcd/Zig_Dynamica_6_Shoes_Black_HQ2130_01_standard.jpg'
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
    stock: 24,
    sizeStock: { '40': 5, '41': 8, '42': 8, '43': 3 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://assets.reebok.com/images/w_600,f_auto,q_auto/e6f7a8b9c0d1e2f3abcd/Mundo_Shoes_Black_HQ5678_01_standard.jpg'
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
    stock: 35,
    sizeStock: { '39': 5, '40': 10, '41': 10, '42': 7, '43': 3 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://assets.reebok.com/images/w_600,f_auto,q_auto/f7a8b9c0d1e2f3a4abcd/Court_Advance_Vulc_Shoes_White_GW5587_01_standard.jpg'
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
    stock: 25,
    sizeStock: { '36': 4, '37': 7, '38': 8, '39': 4, '40': 2 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://www.converse.co.id/media/catalog/product/cache/1/image/600x/A10274.jpg'
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
    stock: 30,
    sizeStock: { '38': 5, '39': 8, '40': 8, '41': 6, '42': 3 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://www.converse.co.id/media/catalog/product/cache/1/image/600x/A09829.jpg'
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
    stock: 20,
    sizeStock: { 'All Size': 20 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://www.converse.co.id/media/catalog/product/cache/1/image/600x/10175-A13-01.jpg'
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
    stock: 30,
    sizeStock: { '39': 5, '40': 10, '41': 8, '42': 5, '43': 2 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/diadora-rayna-men-running.jpg'
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
    stock: 25,
    sizeStock: { '40': 6, '41': 8, '42': 7, '43': 4 },
    isSale: true,
    tag: 'SALE',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/diadora-niles-2-men-navy.jpg'
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
    stock: 28,
    sizeStock: { '39': 4, '40': 8, '41': 8, '42': 5, '43': 3 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/diadora-spinta-men-grey.jpg'
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
    stock: 24,
    sizeStock: { '36': 4, '37': 6, '38': 8, '39': 4, '40': 2 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/astec-nuclear-women-white.jpg'
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
    stock: 22,
    sizeStock: { '36': 3, '37': 6, '38': 7, '39': 4, '40': 2 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/astec-mythos-women-blue.jpg'
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
    stock: 32,
    sizeStock: { '39': 4, '40': 10, '41': 10, '42': 6, '43': 2 },
    isSale: true,
    tag: 'BEST SELLER',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/astec-nero-men-badminton.jpg'
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
    stock: 35,
    sizeStock: { '39': 5, '40': 10, '41': 10, '42': 7, '43': 3 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/airwalk-galaxy-men-lifestyle.jpg'
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
    stock: 28,
    sizeStock: { '39': 5, '40': 8, '41': 8, '42': 5, '43': 2 },
    isSale: true,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'https://images.sportsstation.id/cdn-cgi/image/w=600,q=80/img/products/airwalk-legian-sandals-men.jpg'
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
    image: 'https://www.spalding.com/dw/image/v2/ABAH_PRD/on/demandware.static/-/Sites-spalding-products/default/tf-150-outdoor-basketball.png?sw=600'
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
    image: 'https://www.princetennisbags.com/cdn/shop/products/6R907-200_Tour_Team_6Pack_Bag_600x.jpg'
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
    image: 'https://www.gildanindonesia.com/media/catalog/product/cache/image/600x/64000-sport-tee-white.jpg'
  },
  // --- 11. ASICS RUNNING ---
  {
    id: 'asics-gel-kayano-33',
    name: 'ASICS GEL-KAYANO 33',
    brand: 'asics',
    gender: 'men',
    category: 'running',
    price: 2799000,
    originalPrice: 2799000,
    discount: 0,
    stock: 44,
    sizeStock: { '39': 6, '40': 10, '41': 12, '42': 10, '43': 4, '44': 2 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'asics-gel-nimbus-28',
    name: 'ASICS GEL-NIMBUS 28',
    brand: 'asics',
    gender: 'men',
    category: 'running',
    price: 2699000,
    originalPrice: 2699000,
    discount: 0,
    stock: 40,
    sizeStock: { '39': 5, '40': 8, '41': 12, '42': 10, '43': 3, '44': 2 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'asics-novablast-6',
    name: 'ASICS NOVABLAST 6',
    brand: 'asics',
    gender: 'men',
    category: 'running',
    price: 2199000,
    originalPrice: 2199000,
    discount: 0,
    stock: 38,
    sizeStock: { '39': 4, '40': 8, '41': 12, '42': 8, '43': 4, '44': 2 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'asics-superblast-3',
    name: 'ASICS SUPERBLAST 3',
    brand: 'asics',
    gender: 'men',
    category: 'running',
    price: 3299000,
    originalPrice: 3299000,
    discount: 0,
    stock: 30,
    sizeStock: { '40': 6, '41': 10, '42': 8, '43': 4, '44': 2 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  },
  {
    id: 'asics-metaspeed-tokyo-serie',
    name: 'ASICS METASPEED TOKYO Serie',
    brand: 'asics',
    gender: 'men',
    category: 'running',
    price: 3899000,
    originalPrice: 3899000,
    discount: 0,
    stock: 25,
    sizeStock: { '40': 5, '41': 8, '42': 8, '43': 3, '44': 1 },
    isSale: false,
    tag: 'NEW',
    createdAt: new Date().toISOString(),
    image: 'Asset/Logo/logo.png'
  }
];

function getDeletedProductIds() {
  try {
    const raw = localStorage.getItem('SportsStationDeletedProducts');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function loadCatalogProducts() {
  const deletedIds = getDeletedProductIds();

  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    if (raw) {
      catalogProducts = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading SportsStationCatalog:', e);
    catalogProducts = [];
  }

  // Filter keluar produk yang sudah pernah dihapus admin
  if (Array.isArray(catalogProducts)) {
    catalogProducts = catalogProducts.filter(p => !deletedIds.includes(String(p.id)));
  } else {
    catalogProducts = [];
  }

  if (!catalogProducts || catalogProducts.length === 0) {
    catalogProducts = DEFAULT_CATALOG.filter(defProd => !deletedIds.includes(String(defProd.id)));
    saveCatalogToStorage();
  } else {
    let modified = false;

    // Merge authentic Sports Station products that do not exist yet in stored catalog (DAN BELUM DIHAPUS)
    DEFAULT_CATALOG.forEach(defProd => {
      if (deletedIds.includes(String(defProd.id))) return; // JANGAN pulihkan produk yang sudah sengaja dihapus admin!
      const exists = catalogProducts.some(p => String(p.id) === String(defProd.id));
      if (!exists) {
        catalogProducts.push({ ...defProd });
        modified = true;
      }
    });

    // Ensure every existing product has a valid sizeStock map, createdAt, and tag
    catalogProducts.forEach(prod => {
      if (!prod.sizeStock || Object.keys(prod.sizeStock).length === 0) {
        prod.sizeStock = getDefaultSizesForCategory(prod.category);
        prod.stock = Object.values(prod.sizeStock).reduce((a, b) => a + b, 0);
        modified = true;
      }
      if (!prod.createdAt) {
        prod.createdAt = new Date().toISOString();
        modified = true;
      }
      if (prod.tag === undefined) {
        if (prod.discount >= 50 || prod.isSale) {
          prod.tag = 'SALE';
        } else {
          prod.tag = 'NEW';
        }
        modified = true;
      }
    });

    if (modified) {
      saveCatalogToStorage();
    }
  }
}

function saveCatalogToStorage() {
  try {
    localStorage.setItem('SportsStationCatalog', JSON.stringify(catalogProducts));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving SportsStationCatalog to localStorage:', err);
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('⚠️ Penyimpanan browser lokal penuh, namun sinkronisasi cloud tetap diproses.');
    }
  }
}

function setupProductFilters() {
  const searchInput = document.getElementById('productSearchInput');
  const catFilter = document.getElementById('productCategoryFilter');
  const brandFilter = document.getElementById('productBrandFilter');
  const stockFilter = document.getElementById('productStockFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      productSearchTerm = e.target.value.toLowerCase().trim();
      renderProductsTable();
    });
  }

  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      productCategoryFilter = e.target.value.toLowerCase().trim();
      renderProductsTable();
    });
  }

  if (brandFilter) {
    brandFilter.addEventListener('change', (e) => {
      productBrandFilter = e.target.value.toLowerCase().trim();
      renderProductsTable();
    });
  }

  if (stockFilter) {
    stockFilter.addEventListener('change', (e) => {
      productStockFilter = e.target.value;
      renderProductsTable();
    });
  }

  // Setup Image Dropzone & File Manager Support
  setupImageDropzone();

  // Live image preview for URL input (with debounce, paste support, validation)
  setupImageUrlLivePreview();

  // Live price formatting & discount placement helper
  const priceInputEl = document.getElementById('prodPriceInput');
  if (priceInputEl) {
    priceInputEl.addEventListener('input', () => {
      updatePriceAndDiscountCalculation();
    });
  }

  const discInputEl = document.getElementById('prodDiscountPercentInput');
  if (discInputEl) {
    discInputEl.addEventListener('input', () => {
      updatePriceAndDiscountCalculation();
    });
  }

  // Bind Form Submit
  const prodForm = document.getElementById('adminProductForm');
  if (prodForm) {
    prodForm.addEventListener('submit', handleProductFormSubmit);
  }

  // Bind Modal Close Buttons
  const closeBtn = document.getElementById('productModalClose');
  const cancelBtn = document.getElementById('productModalCancelBtn');
  if (closeBtn) closeBtn.onclick = closeProductModal;
  if (cancelBtn) cancelBtn.onclick = closeProductModal;
}

function syncFilterDropdownOptions() {
  // Brand & Kategori di admin sinkron dan konsisten sesuai katalog toko shop
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  syncFilterDropdownOptions();

  let filtered = [...catalogProducts];


  if (productSearchTerm) {
    filtered = filtered.filter(p => {
      const matchName = p.name.toLowerCase().includes(productSearchTerm);
      const matchBrand = (p.brand || '').toLowerCase().includes(productSearchTerm);
      const matchCat = (p.category || '').toLowerCase().includes(productSearchTerm);
      return matchName || matchBrand || matchCat;
    });
  }

  if (productCategoryFilter) {
    filtered = filtered.filter(p => {
      const cat = (p.category || '').toLowerCase();
      if (productCategoryFilter === 'sneakers' || productCategoryFilter === 'lifestyle') {
        return cat === 'sneakers' || cat === 'lifestyle';
      }
      return cat === productCategoryFilter;
    });
  }

  if (productBrandFilter) {
    filtered = filtered.filter(p => (p.brand || '').toLowerCase() === productBrandFilter);
  }

  if (productStockFilter) {
    if (productStockFilter === 'high') {
      filtered = filtered.filter(p => (p.stock || 0) > 20);
    } else if (productStockFilter === 'low') {
      filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 20);
    } else if (productStockFilter === 'empty') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="fa-solid fa-boxes-stacked" style="font-size: 28px; margin-bottom: 8px; display: block; color: #cbd5e1;"></i>
          Tidak ada produk yang sesuai dengan filter pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    // Recalculate total stock from sizeStock if present
    const sizeStock = p.sizeStock || {};
    const sizeEntries = Object.entries(sizeStock);
    const totalStock = sizeEntries.length > 0 
      ? sizeEntries.reduce((sum, [, q]) => sum + (Number(q) || 0), 0)
      : Number(p.stock !== undefined ? p.stock : 25);

    let stockBadge = '<span class="order-badge-pill status-dikirim"><i class="fa-solid fa-check"></i> Tersedia Banyak</span>';
    if (totalStock === 0) {
      stockBadge = '<span class="order-badge-pill" style="background-color: #fee2e2; color: #ef4444;"><i class="fa-solid fa-xmark"></i> Stok Habis</span>';
    } else if (totalStock <= 20) {
      stockBadge = '<span class="order-badge-pill status-menunggu-pembayaran"><i class="fa-solid fa-triangle-exclamation"></i> Menipis (' + totalStock + ')</span>';
    }

    const discountTag = p.discount > 0 
      ? `<span style="background-color: #fef2f2; color: #ef4444; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">-${p.discount}%</span>` 
      : '<span style="color: #94a3b8; font-size: 12px;">-</span>';

    // Render chips of sizes
    const chipsHtml = sizeEntries.map(([sz, q]) => `
      <span class="size-chip ${q === 0 ? 'empty' : ''}" title="Ukuran ${sz}: ${q} unit">
        ${sz}: <strong>${q}</strong>
      </span>
    `).join('');

    return `
      <tr>
        <td>
          <img src="${p.image}" alt="${p.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" onerror="this.src='Asset/Logo/logo.png'">
        </td>
        <td>
          <div style="font-weight: 600; color: #0f172a; max-width: 250px; font-size: 13px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
            <span>${p.name}</span>
            ${p.tag ? `<span class="badge-prod-tag ${getTagBadgeClass(p.tag)}">${p.tag}</span>` : ''}
          </div>
          <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
            <span class="badge-brand">${p.brand || 'Sports'}</span>
            <span style="font-size: 11px; color: #64748b;">Gender: ${p.gender || 'Unisex'}</span>
          </div>
        </td>
        <td>
          <span class="badge-category">${p.category || 'General'}</span>
        </td>
        <td>
          <strong style="color: #0f172a;">${formatRupiah(p.price)}</strong>
          ${p.originalPrice && p.originalPrice > p.price ? `<div style="font-size: 11px; color: #94a3b8; text-decoration: line-through;">${formatRupiah(p.originalPrice)}</div>` : ''}
        </td>
        <td>
          ${discountTag}
        </td>
        <td>
          <!-- Per-Size Stock Column with Quick Action -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #0f172a; font-size: 13px;">Total: <strong>${totalStock} Unit</strong></span>
            <button type="button" class="btn-quick-size-edit" onclick="openQuickSizeModal('${p.id}')" title="Edit stok masing-masing ukuran">
              <i class="fa-solid fa-pen-to-square"></i> Atur Size
            </button>
          </div>
          <div class="size-chips-wrap">
            ${chipsHtml || `<span style="font-size: 11px; color: #94a3b8;">${totalStock} unit</span>`}
          </div>
        </td>
        <td>
          ${stockBadge}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="admin-btn-action" onclick="openProductModal('${p.id}')" title="Edit Rincian Lengkap &amp; Kategori">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn-delete-prod" onclick="deleteProduct('${p.id}')" title="Hapus Produk">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * ============================================================================
 * 9. MODAL TAMBAH / EDIT PRODUK DENGAN MANAJEMEN UKURAN (SIZE BREAKDOWN)
 * ============================================================================
 */
function handleCategoryChangeForSizes(cat) {
  const currentKeys = Object.keys(currentModalSizeStock);
  const isFootwearCat = ['running', 'lifestyle', 'sneakers', 'walking', 'fitness', 'basketball', 'football', 'training', 'badminton', 'tennis', 'sandals'].includes(cat);
  const isApparelCat = ['tshirt', 'shorts', 'pants', 'sports-bra', 'jacket', 'tanktop', 'swimwear', 'swimming'].includes(cat);

  const hasShoeKeys = currentKeys.some(k => /^[34][0-9]$/.test(k));
  const hasApparelKeys = currentKeys.some(k => ['S', 'M', 'L', 'XL', 'XXL'].includes(k));

  if (isFootwearCat && !hasShoeKeys) {
    applySizePreset('shoes');
  } else if (isApparelCat && !hasApparelKeys) {
    applySizePreset('apparel');
  } else if (!isFootwearCat && !isApparelCat && (hasShoeKeys || hasApparelKeys)) {
    applySizePreset('onesize');
  }
}

function applySizePreset(type) {
  if (type === 'shoes') {
    currentModalSizeStock = { '38': 4, '39': 8, '40': 10, '41': 12, '42': 10, '43': 7, '44': 4, '45': 2 };
  } else if (type === 'apparel') {
    currentModalSizeStock = { 'S': 8, 'M': 15, 'L': 12, 'XL': 8, 'XXL': 4 };
  } else if (type === 'onesize') {
    currentModalSizeStock = { 'All Size': 25 };
  }

  // Update active preset button highlight
  ['shoes', 'apparel', 'onesize'].forEach(t => {
    const btn = document.getElementById(`presetBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === type) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  renderModalSizeStockGrid();
  calculateTotalModalStock();
}

function renderModalSizeStockGrid() {
  const grid = document.getElementById('modalSizeStockGrid');
  if (!grid) return;

  const entries = Object.entries(currentModalSizeStock);
  if (entries.length === 0) {
    grid.innerHTML = '<div style="color: #64748b; font-size: 12px; grid-column: 1 / -1; padding: 10px;">Belum ada ukuran. Klik preset di atas atau tambah ukuran baru.</div>';
    return;
  }

  grid.innerHTML = entries.map(([sizeKey, qty]) => `
    <div class="size-stock-card">
      <div class="size-stock-card-top">
        <span class="size-label-tag">Size: ${sizeKey}</span>
        <button type="button" class="size-remove-btn" onclick="removeModalSizeKey('${sizeKey}')" title="Hapus ukuran ini">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="size-stock-input-wrap">
        <button type="button" class="btn-step-size" onclick="stepModalSizeQty('${sizeKey}', -1)">-</button>
        <input type="number" class="input-size-qty" value="${qty}" min="0" onchange="updateModalSizeQty('${sizeKey}', this.value)" oninput="updateModalSizeQty('${sizeKey}', this.value)">
        <button type="button" class="btn-step-size" onclick="stepModalSizeQty('${sizeKey}', 1)">+</button>
      </div>
    </div>
  `).join('');
}

function stepModalSizeQty(key, delta) {
  const current = Number(currentModalSizeStock[key] || 0);
  currentModalSizeStock[key] = Math.max(0, current + delta);
  renderModalSizeStockGrid();
  calculateTotalModalStock();
}

function updateModalSizeQty(key, val) {
  currentModalSizeStock[key] = Math.max(0, parseInt(val, 10) || 0);
  calculateTotalModalStock();
}

function removeModalSizeKey(key) {
  delete currentModalSizeStock[key];
  renderModalSizeStockGrid();
  calculateTotalModalStock();
}

function promptAddCustomSize() {
  const name = prompt('Masukkan nama ukuran baru (contoh: 36, 46, XS, XXXL, 10L):');
  if (!name) return;
  const clean = name.trim().toUpperCase();
  if (!clean) return;
  if (currentModalSizeStock[clean] !== undefined) {
    alert(`Ukuran "${clean}" sudah ada!`);
    return;
  }
  currentModalSizeStock[clean] = 5;
  renderModalSizeStockGrid();
  calculateTotalModalStock();
}

function calculateTotalModalStock() {
  const total = Object.values(currentModalSizeStock).reduce((sum, q) => sum + (Number(q) || 0), 0);
  const badge = document.getElementById('modalTotalStockBadge');
  if (badge) {
    badge.textContent = total + ' Unit';
  }
  return total;
}

window.setProductTagPreset = function (tag) {
  const tagInput = document.getElementById('prodTagInput');
  if (tagInput) tagInput.value = tag;
};

window.setDiscountPercent = function (percent) {
  const discInput = document.getElementById('prodDiscountPercentInput');
  if (discInput) {
    discInput.value = Math.max(0, Math.min(99, parseInt(percent, 10) || 0));
    updatePriceAndDiscountCalculation();
  }
};

function updatePriceAndDiscountCalculation() {
  const basePriceInput = document.getElementById('prodPriceInput');
  const discInput = document.getElementById('prodDiscountPercentInput');
  const basePriceFormatted = document.getElementById('prodPriceFormatted');
  const finalPriceText = document.getElementById('prodFinalPriceText');
  const noteEl = document.getElementById('prodSalePlacementNote');
  const tagInput = document.getElementById('prodTagInput');

  if (!basePriceInput || !discInput) return;

  const basePrice = Number(basePriceInput.value) || 0;
  const discount = Math.max(0, Math.min(99, parseInt(discInput.value, 10) || 0));

  if (basePriceFormatted) {
    basePriceFormatted.textContent = basePrice > 0 ? `Harga Normal: ${formatRupiah(basePrice)}` : '';
  }

  let finalPrice = basePrice;
  if (discount > 0 && basePrice > 0) {
    finalPrice = Math.round(basePrice * (1 - (discount / 100)));
  }

  if (finalPriceText) {
    if (basePrice > 0) {
      if (discount > 0) {
        finalPriceText.innerHTML = `<span style="color: #16a34a; font-weight: 700;">${formatRupiah(finalPrice)}</span> <span style="font-size: 11px; color: #dc2626; font-weight: 700; margin-left: 4px;">(-${discount}%)</span>`;
      } else {
        finalPriceText.innerHTML = `<span style="color: #0f172a; font-weight: 600;">${formatRupiah(basePrice)} (Tanpa Diskon)</span>`;
      }
    } else {
      finalPriceText.textContent = '-';
    }
  }

  // Live placement note for Sale 50%
  if (noteEl) {
    if (discount >= 50 && basePrice > 0) {
      noteEl.style.display = 'block';
      noteEl.innerHTML = `<i class="fa-solid fa-fire"></i> Diskon ${discount}% aktif: Produk otomatis muncul di rak "Sale 50%" di Beranda!`;
      // Auto-suggest SALE tag if empty or NEW
      if (tagInput && (!tagInput.value || tagInput.value === 'NEW')) {
        tagInput.value = 'SALE';
      }
    } else {
      noteEl.style.display = 'none';
      if (tagInput && tagInput.value === 'SALE' && discount === 0) {
        tagInput.value = 'NEW';
      }
    }
  }
}

function getTagBadgeClass(tag) {
  const t = (tag || '').toLowerCase();
  if (t.includes('new')) return 'tag-new';
  if (t.includes('hot')) return 'tag-hot';
  if (t.includes('best')) return 'tag-best';
  if (t.includes('limit')) return 'tag-limited';
  if (t.includes('sale')) return 'tag-sale';
  return '';
}

let currentProductImageData = '';
let currentImageInputMode = 'url';

function switchImageInputMode(mode) {
  currentImageInputMode = mode;
  const btnFile = document.getElementById('btnModeFile');
  const btnUrl = document.getElementById('btnModeUrl');
  const dropzone = document.getElementById('imageFileDropzone');
  const urlBox = document.getElementById('imageUrlBox');

  if (mode === 'file') {
    if (btnFile) btnFile.classList.add('active');
    if (btnUrl) btnUrl.classList.remove('active');
    if (dropzone) dropzone.style.display = 'block';
    if (urlBox) urlBox.style.display = 'none';
  } else {
    if (btnUrl) btnUrl.classList.add('active');
    if (btnFile) btnFile.classList.remove('active');
    if (dropzone) dropzone.style.display = 'none';
    if (urlBox) urlBox.style.display = 'block';

    const urlInput = document.getElementById('prodImageInput');
    if (urlInput && currentProductImageData && !currentProductImageData.startsWith('data:image')) {
      if (!urlInput.value) {
        urlInput.value = currentProductImageData;
      }
    }
    // Auto-focus the URL input
    setTimeout(() => {
      if (urlInput) urlInput.focus();
    }, 100);
  }
}

// Kompresi gambar lokal otomatis via HTML5 Canvas agar muat di localStorage & cepat di-sync ke Supabase
function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onerror = () => {
        // Fallback: gunakan raw data URL jika format canvas browser tidak mendukung
        resolve(rawDataUrl);
      };
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
          } catch (err) {}
          if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl || rawDataUrl);
        } catch (err) {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// Live preview handler for URL image input
function setupImageUrlLivePreview() {
  const urlInput = document.getElementById('prodImageInput');
  if (!urlInput || urlInput._livePreviewAttached) return;
  urlInput._livePreviewAttached = true;

  let debounceTimer = null;

  function updateImagePreviewFromUrl(rawUrl) {
    const url = (rawUrl || '').trim().replace(/^["']|["']$/g, '');
    if (!url) return;

    currentImageInputMode = 'url';
    const imgPreview = document.getElementById('prodImagePreview');
    const nameEl = document.getElementById('imagePreviewName');
    const badge = document.getElementById('imageSourceLabel');

    if (badge) {
      badge.textContent = 'Memeriksa URL...';
      badge.style.background = '#fef3c7';
      badge.style.color = '#92400e';
    }

    if (imgPreview) {
      imgPreview.referrerPolicy = 'no-referrer';
      imgPreview.src = url;

      imgPreview.onerror = function () {
        this.src = 'Asset/Logo/logo.png';
        if (nameEl) nameEl.textContent = '⚠️ Gagal memuat gambar (Pastikan link gambar langsung)';
        if (badge) {
          badge.textContent = 'URL Tidak Valid / Diblokir';
          badge.style.background = '#fee2e2';
          badge.style.color = '#dc2626';
        }
      };

      imgPreview.onload = function () {
        if (this.src.includes('logo.png') && url !== 'Asset/Logo/logo.png') return;
        if (badge) {
          badge.textContent = '✅ Gambar Berhasil Dimuat';
          badge.style.background = '#dcfce7';
          badge.style.color = '#15803d';
        }
      };
    }

    currentProductImageData = url;

    if (nameEl) {
      try {
        const filename = url.includes('/') ? url.substring(url.lastIndexOf('/') + 1).split('?')[0] : url;
        nameEl.textContent = decodeURIComponent(filename).substring(0, 60) || url.substring(0, 60);
      } catch (e) {
        nameEl.textContent = url.substring(0, 60);
      }
    }
  }

  ['input', 'paste', 'change'].forEach(eventName => {
    urlInput.addEventListener(eventName, function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const val = urlInput.value.trim();
        if (val) {
          updateImagePreviewFromUrl(val);
        }
      }, eventName === 'paste' ? 50 : 300);
    });
  });
}

async function handleProductFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const isImageFile = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|avif|gif|svg|jfif|bmp)$/i.test(file.name);
  if (!isImageFile) {
    alert('File yang dipilih harus berupa file gambar (PNG, JPG, JPEG, WEBP, AVIF).');
    return;
  }

  const nameEl = document.getElementById('imagePreviewName');
  const badge = document.getElementById('imageSourceLabel');
  const imgPreview = document.getElementById('prodImagePreview');
  const imgInput = document.getElementById('prodImageInput');

  if (nameEl) nameEl.textContent = `⏳ Memproses ${file.name}...`;
  if (badge) {
    badge.textContent = 'Memproses...';
    badge.style.background = '#fef3c7';
    badge.style.color = '#92400e';
  }

  try {
    const dataUrl = await compressImageFile(file, 800, 800, 0.82);
    if (!dataUrl) throw new Error('Data gambar kosong');

    currentProductImageData = dataUrl;
    currentImageInputMode = 'file';

    if (imgPreview) {
      imgPreview.referrerPolicy = 'no-referrer';
      imgPreview.src = dataUrl;
    }

    if (imgInput) imgInput.value = '';

    const approxKb = Math.round(dataUrl.length * 0.75 / 1024);
    if (nameEl) nameEl.textContent = `${file.name} (Tersimpan ${approxKb} KB)`;

    if (badge) {
      badge.textContent = '✅ File Komputer (Siap Disimpan)';
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
    }
  } catch (err) {
    console.error('Gagal memproses gambar:', err);
    alert('Gagal memproses gambar: ' + (err.message || 'Format tidak didukung'));
    if (nameEl) nameEl.textContent = '⚠️ Gagal memproses gambar';
  }
}

function resetProductImage() {
  currentProductImageData = '';
  const fileInput = document.getElementById('prodImageFileInput');
  if (fileInput) fileInput.value = '';

  const imgInput = document.getElementById('prodImageInput');
  if (imgInput) imgInput.value = '';

  const imgPreview = document.getElementById('prodImagePreview');
  if (imgPreview) {
    imgPreview.referrerPolicy = 'no-referrer';
    imgPreview.src = 'Asset/Logo/logo.png';
  }

  const nameEl = document.getElementById('imagePreviewName');
  if (nameEl) nameEl.textContent = 'Belum ada foto (Default Logo)';

  const badge = document.getElementById('imageSourceLabel');
  if (badge) {
    badge.textContent = 'Kosong';
    badge.style.background = '#f1f5f9';
    badge.style.color = '#64748b';
  }
}

function setupImageDropzone() {
  const dropzone = document.getElementById('imageFileDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      const fileInput = document.getElementById('prodImageFileInput');
      if (fileInput) fileInput.files = files;
      handleProductFileSelected({ target: { files } });
    }
  });
}

function openProductModal(productId = null) {
  const modal = document.getElementById('adminProductModal');
  const modalTitle = document.getElementById('productModalTitle');
  const idInput = document.getElementById('editProductId');
  const nameInput = document.getElementById('prodNameInput');
  const brandInput = document.getElementById('prodBrandInput');
  const catInput = document.getElementById('prodCategoryInput');
  const genderInput = document.getElementById('prodGenderInput');
  const priceInput = document.getElementById('prodPriceInput');
  const discInput = document.getElementById('prodDiscountPercentInput');
  const imgInput = document.getElementById('prodImageInput');
  const imgPreview = document.getElementById('prodImagePreview');
  const nameEl = document.getElementById('imagePreviewName');
  const badge = document.getElementById('imageSourceLabel');

  if (!modal) return;

  if (productId) {
    // Edit Mode
    const prod = catalogProducts.find(p => String(p.id) === String(productId));
    if (!prod) return;

    modalTitle.textContent = 'Edit Produk & Kategori';
    idInput.value = prod.id;
    nameInput.value = prod.name || '';
    brandInput.value = (prod.brand || 'nike').toLowerCase();
    catInput.value = (prod.category || 'running').toLowerCase();
    genderInput.value = (prod.gender || 'men').toLowerCase();

    // Base price: if product was on sale, originalPrice was the retail price
    const baseRetail = (prod.originalPrice && prod.originalPrice > prod.price) ? prod.originalPrice : prod.price;
    priceInput.value = baseRetail || '';

    if (discInput) {
      discInput.value = prod.discount || 0;
    }

    const imgVal = prod.image || 'Asset/Logo/logo.png';
    currentProductImageData = imgVal;
    if (imgPreview) {
      imgPreview.referrerPolicy = 'no-referrer';
      imgPreview.src = imgVal;
    }

    if (imgVal.startsWith('data:image')) {
      switchImageInputMode('file');
      if (imgInput) imgInput.value = '';
      if (nameEl) nameEl.textContent = 'Foto Komputer Tersimpan';
      if (badge) {
        badge.textContent = 'File Komputer (Lokal)';
        badge.style.background = '#dcfce7';
        badge.style.color = '#15803d';
      }
    } else {
      switchImageInputMode('url');
      if (imgInput) imgInput.value = imgVal;
      if (nameEl) nameEl.textContent = imgVal.substring(imgVal.lastIndexOf('/') + 1) || imgVal;
      if (badge) {
        badge.textContent = imgVal.startsWith('http') ? 'Tautan Web (URL)' : 'Path Lokal (Asset)';
        badge.style.background = '#e0f2fe';
        badge.style.color = '#0369a1';
      }
    }

    const tagInput = document.getElementById('prodTagInput');
    if (tagInput) tagInput.value = prod.tag !== undefined ? prod.tag : '';

    // Load existing size stock or generate defaults
    currentModalSizeStock = { ...(prod.sizeStock || getDefaultSizesForCategory(prod.category)) };
  } else {
    // Add Mode
    modalTitle.textContent = 'Tambah Produk Baru';
    idInput.value = '';
    nameInput.value = '';
    brandInput.value = 'nike';
    catInput.value = 'running';
    genderInput.value = 'men';
    priceInput.value = '';

    if (discInput) {
      discInput.value = 0;
    }

    switchImageInputMode('url');
    resetProductImage();

    const tagInput = document.getElementById('prodTagInput');
    if (tagInput) tagInput.value = 'NEW';

    // Default sizes for running shoes
    currentModalSizeStock = { '38': 4, '39': 8, '40': 10, '41': 12, '42': 10, '43': 7, '44': 4, '45': 2 };
  }

  // Tombol Hapus di dalam modal
  const deleteBtn = document.getElementById('productModalDeleteBtn');
  if (deleteBtn) {
    if (productId) {
      deleteBtn.style.display = 'inline-flex';
      deleteBtn.onclick = () => {
        closeProductModal();
        deleteProduct(productId);
      };
    } else {
      deleteBtn.style.display = 'none';
      deleteBtn.onclick = null;
    }
  }

  renderModalSizeStockGrid();
  calculateTotalModalStock();
  updatePriceAndDiscountCalculation();

  modal.style.display = 'flex';
}

function closeProductModal() {
  const modal = document.getElementById('adminProductModal');
  if (modal) modal.style.display = 'none';
}

function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editProductId').value.trim();
  const name = document.getElementById('prodNameInput').value.trim();
  const brand = document.getElementById('prodBrandInput').value;
  const category = document.getElementById('prodCategoryInput').value;
  const gender = document.getElementById('prodGenderInput').value;
  const basePrice = Number(document.getElementById('prodPriceInput').value);
  const discount = Math.max(0, Math.min(99, parseInt(document.getElementById('prodDiscountPercentInput')?.value, 10) || 0));

  let image = '';
  const rawUrl = (document.getElementById('prodImageInput')?.value || '').trim().replace(/^["']|["']$/g, '');
  if (currentImageInputMode === 'file' && currentProductImageData && currentProductImageData.startsWith('data:image')) {
    image = currentProductImageData;
  } else if (rawUrl) {
    image = rawUrl;
  } else if (currentProductImageData) {
    image = currentProductImageData;
  } else {
    image = 'Asset/Logo/logo.png';
  }

  if (!name || !basePrice) {
    alert('Nama produk dan harga normal wajib diisi.');
    return;
  }

  const totalStock = calculateTotalModalStock();

  let finalPrice = basePrice;
  let originalPrice = basePrice;
  let isSale = false;

  if (discount > 0) {
    finalPrice = Math.round(basePrice * (1 - (discount / 100)));
    originalPrice = basePrice;
    isSale = true;
  }

  const isEditing = Boolean(id);
  let savedProd = null;

  if (isEditing) {
    // Update existing product
    const prod = catalogProducts.find(p => p.id === id);
    if (prod) {
      prod.name = name;
      prod.brand = brand;
      prod.category = category;
      prod.gender = gender;
      prod.price = finalPrice;
      prod.originalPrice = originalPrice;
      prod.discount = discount;
      prod.isSale = isSale;
      prod.tag = (document.getElementById('prodTagInput')?.value || '').trim();
      if (!prod.createdAt) {
        prod.createdAt = new Date().toISOString();
      }
      prod.sizeStock = { ...currentModalSizeStock };
      prod.stock = totalStock;
      prod.image = image;
      savedProd = prod;
    }
    let placementNotice = '';
    if (discount >= 50) {
      placementNotice = ' 🏷️ Otomatis masuk rak Sale 50% Beranda!';
    } else if (savedProd && savedProd.tag && savedProd.tag.toUpperCase() === 'NEW') {
      placementNotice = ' ✨ Tampil di rak Newest Collection selama 7 hari.';
    } else if (savedProd && savedProd.tag === '') {
      placementNotice = ' ℹ️ Tag dihapus (dikeluarkan dari rak Newest Collection).';
    }
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast(`Produk "${name}" berhasil diperbarui dengan foto baru!${placementNotice}`);
    }
  } else {
    // Create new product
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newId = slug + '-' + Math.floor(1000 + Math.random() * 9000);
    const tag = (document.getElementById('prodTagInput')?.value || '').trim();

    const newProd = {
      id: newId,
      name: name,
      brand: brand,
      category: category,
      gender: gender,
      price: finalPrice,
      originalPrice: originalPrice,
      discount: discount,
      isSale: isSale,
      tag: tag,
      createdAt: new Date().toISOString(),
      sizeStock: { ...currentModalSizeStock },
      stock: totalStock,
      image: image
    };

    catalogProducts.unshift(newProd);
    savedProd = newProd;

    let placementNotice = '';
    if (discount >= 50) {
      placementNotice = ' 🏷️ Otomatis masuk rak Sale 50% Beranda!';
    } else if (tag && tag.toUpperCase() === 'NEW') {
      placementNotice = ' ✨ Tampil di rak Newest Collection selama 7 hari.';
    }
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast(`Produk baru "${name}" berhasil ditambahkan (${totalStock} unit)!${placementNotice}`);
    }
  }

  // Jika produk baru atau edit disimpan, pastikan ID-nya dibersihkan dari blacklist deleted
  if (savedProd && savedProd.id) {
    const deletedIds = getDeletedProductIds();
    if (deletedIds.includes(String(savedProd.id))) {
      const updated = deletedIds.filter(id => id !== String(savedProd.id));
      localStorage.setItem('SportsStationDeletedProducts', JSON.stringify(updated));
    }
  }

  saveCatalogToStorage();

  if (window.SportsStationDB && savedProd) {
    window.SportsStationDB.upsertProduct(savedProd).then(() => {
      console.log('✅ Berhasil sync produk ke Supabase:', savedProd.id);
    }).catch(err => {
      console.warn('⚠️ Gagal sync produk ke Supabase:', err);
    });
  }

  renderProductsTable();
  closeProductModal();
}

async function deleteProduct(productId) {
  const strId = String(productId);
  const prod = catalogProducts.find(p => String(p.id) === strId);
  if (!prod) {
    console.warn('Produk tidak ditemukan dalam katalog:', productId);
    return;
  }

  const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus produk "${prod.name}" dari katalog toko?`);
  if (!confirmDelete) return;

  // 1. Simpan ke blacklist deleted IDs agar tidak pernah dipulihkan lagi oleh DEFAULT_CATALOG / DEFAULT_PRODUCTS / Supabase sync
  const deletedIds = getDeletedProductIds();
  if (!deletedIds.includes(strId)) {
    deletedIds.push(strId);
    localStorage.setItem('SportsStationDeletedProducts', JSON.stringify(deletedIds));
  }

  // 2. Hapus dari catalogProducts di memori
  catalogProducts = catalogProducts.filter(p => String(p.id) !== strId);

  // 3. Simpan catalog baru ke localStorage
  saveCatalogToStorage();

  // 4. Render ulang tabel & overview segera
  renderProductsTable();
  renderSalesOverview();

  // 5. Toast notifikasi berhasil
  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`Produk "${prod.name}" berhasil dihapus.`);
  }

  // 6. Hapus dari Supabase jika online
  if (window.SportsStationDB) {
    try {
      await window.SportsStationDB.deleteProduct(strId);
      console.log('✅ Berhasil sinkronisasi hapus produk ke Supabase:', strId);
    } catch (err) {
      console.warn('⚠️ Gagal sync hapus produk ke Supabase:', err);
    }
  }
}

/**
 * ============================================================================
 * 10. QUICK SIZE STOCK EDITOR MODAL (EDIT CEPAT STOK PER SIZE)
 * ============================================================================
 */
function openQuickSizeModal(productId) {
  const prod = catalogProducts.find(p => p.id === productId);
  if (!prod) return;

  quickSizeEditingProductId = productId;
  quickSizeTempStock = { ...(prod.sizeStock || getDefaultSizesForCategory(prod.category)) };

  const modal = document.getElementById('adminQuickSizeModal');
  const nameEl = document.getElementById('quickSizeProdName');
  if (nameEl) nameEl.textContent = prod.name;

  renderQuickSizeGrid();
  updateQuickSizeTotalBadge();

  if (modal) modal.style.display = 'flex';
}

function closeQuickSizeModal() {
  const modal = document.getElementById('adminQuickSizeModal');
  if (modal) modal.style.display = 'none';
  quickSizeEditingProductId = null;
  quickSizeTempStock = {};
}

function renderQuickSizeGrid() {
  const grid = document.getElementById('quickSizeGrid');
  if (!grid) return;

  grid.innerHTML = Object.entries(quickSizeTempStock).map(([sz, qty]) => `
    <div class="size-stock-card">
      <div class="size-stock-card-top">
        <span class="size-label-tag">Size: ${sz}</span>
      </div>
      <div class="size-stock-input-wrap">
        <button type="button" class="btn-step-size" onclick="stepQuickSizeQty('${sz}', -1)">-</button>
        <input type="number" class="input-size-qty" value="${qty}" min="0" onchange="updateQuickSizeQty('${sz}', this.value)" oninput="updateQuickSizeQty('${sz}', this.value)">
        <button type="button" class="btn-step-size" onclick="stepQuickSizeQty('${sz}', 1)">+</button>
      </div>
    </div>
  `).join('');
}

function stepQuickSizeQty(sz, delta) {
  const cur = Number(quickSizeTempStock[sz] || 0);
  quickSizeTempStock[sz] = Math.max(0, cur + delta);
  renderQuickSizeGrid();
  updateQuickSizeTotalBadge();
}

function updateQuickSizeQty(sz, val) {
  quickSizeTempStock[sz] = Math.max(0, parseInt(val, 10) || 0);
  updateQuickSizeTotalBadge();
}

function updateQuickSizeTotalBadge() {
  const total = Object.values(quickSizeTempStock).reduce((sum, q) => sum + (Number(q) || 0), 0);
  const badge = document.getElementById('quickSizeTotalBadge');
  if (badge) badge.textContent = `Total: ${total} Unit`;
}

function saveQuickSizeStock() {
  if (!quickSizeEditingProductId) return;
  const prod = catalogProducts.find(p => p.id === quickSizeEditingProductId);
  if (!prod) return;

  prod.sizeStock = { ...quickSizeTempStock };
  prod.stock = Object.values(prod.sizeStock).reduce((sum, q) => sum + (Number(q) || 0), 0);

  saveCatalogToStorage();
  if (window.SportsStationDB) {
    window.SportsStationDB.upsertProduct(prod);
  }
  renderProductsTable();
  closeQuickSizeModal();

  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast(`Stok per-size "${prod.name}" berhasil disimpan (${prod.stock} unit total).`);
  }
}

// Global exposes for product actions & inline size stock clicks
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.deleteProduct = deleteProduct;
window.openQuickSizeModal = openQuickSizeModal;
window.closeQuickSizeModal = closeQuickSizeModal;
window.saveQuickSizeStock = saveQuickSizeStock;
window.applySizePreset = applySizePreset;
window.promptAddCustomSize = promptAddCustomSize;
window.removeModalSizeKey = removeModalSizeKey;
window.stepModalSizeQty = stepModalSizeQty;
window.updateModalSizeQty = updateModalSizeQty;
window.handleCategoryChangeForSizes = handleCategoryChangeForSizes;
window.stepQuickSizeQty = stepQuickSizeQty;
window.updateQuickSizeQty = updateQuickSizeQty;
window.setDiscountPercent = setDiscountPercent;
window.updatePriceAndDiscountCalculation = updatePriceAndDiscountCalculation;
window.switchImageInputMode = switchImageInputMode;
window.handleProductFileSelected = handleProductFileSelected;
window.resetProductImage = resetProductImage;
