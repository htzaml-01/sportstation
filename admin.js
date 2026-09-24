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

function initAdminDashboard() {
  checkAdminAuth();
  setupSidebarNavigation();
  updateDatabaseStatusUI();
  refreshAdminData();
  setupProductFilters();
  setupModals();
  setupLiveSync();

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
function checkAdminAuth() {
  if (window.SportsStationAuth) {
    const user = window.SportsStationAuth.getUser();
    if (!user || user.role !== 'admin') {
      // Auto-promote or allow demo testing if opened directly
      console.warn('Current user is not admin. Auto-authenticating admin session for development.');
      const adminUser = {
        name: 'Administrator',
        email: 'admin@sportsstation.id',
        role: 'admin',
        memberId: 'SS-ADMIN-01',
        isLoggedIn: true
      };
      localStorage.setItem('sportsstation_user', JSON.stringify(adminUser));
    }
  }

  // Bind Logout Button
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (window.SportsStationAuth) {
        window.SportsStationAuth.logout();
      } else {
        localStorage.removeItem('sportsstation_user');
      }
      window.location.href = 'login.html';
    });
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
      ordersData = Array.isArray(parsed) ? parsed : [];
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

    if (ord.status === 'Diproses' || ord.status === 'Menunggu Pembayaran') {
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
  if (badgeOrdEl) badgeOrdEl.textContent = pendingProcessingCount;

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
          <button class="admin-btn-action" onclick="document.querySelector('[data-view=orders]').click();" title="Buka Detail di Proses Pesanan">
            <i class="fa-solid fa-arrow-right"></i> Proses
          </button>
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
    if (currentOrderFilter === 'semua') return true;
    if (currentOrderFilter === 'menunggu-pembayaran') return ord.status.toLowerCase().includes('menunggu');
    if (currentOrderFilter === 'diproses') return ord.status.toLowerCase().includes('proses');
    if (currentOrderFilter === 'dikirim') return ord.status.toLowerCase().includes('kirim');
    if (currentOrderFilter === 'selesai') return ord.status.toLowerCase().includes('selesai');
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
          <div style="display: flex; align-items: center; gap: 8px;">
            <select class="admin-action-select" onchange="updateOrderStatus('${ord.id}', this.value)" title="Ubah Status Pesanan">
              <option value="Menunggu Pembayaran" ${ord.status === 'Menunggu Pembayaran' ? 'selected' : ''}>Menunggu Pembayaran</option>
              <option value="Diproses" ${ord.status === 'Diproses' ? 'selected' : ''}>Diproses (Jakarta HQ)</option>
              <option value="Dikirim" ${ord.status === 'Dikirim' ? 'selected' : ''}>Dikirim (Biteship/Kurir)</option>
              <option value="Selesai" ${ord.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
              <option value="Dibatalkan" ${ord.status === 'Dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
            </select>
            <button class="admin-btn-action" onclick="openOrderDetailModal('${ord.id}')" title="Lihat Rincian Pesanan">
              <i class="fa-solid fa-eye"></i> Detail
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
          <button class="admin-btn-action" onclick="printInvoice('${ord.id}')">
            <i class="fa-solid fa-receipt"></i> Invoice
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 7. Order Details Modal & Invoice
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
  modal.style.display = 'flex';
}

function printInvoice(orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=800,height=700');
  if (!printWindow) {
    alert('Popup diblokir browser. Harap izinkan popup.');
    return;
  }

  const itemsHtml = (order.items || []).map(it => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${it.name} (${it.size ? 'Size ' + it.size : ''})</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${it.qty}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatRupiah(it.price)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatRupiah(it.price * it.qty)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>INVOICE ${order.id} - SPORTS STATION</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f95a00; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #f95a00; font-family: 'Montserrat', sans-serif; }
        .invoice-title { font-size: 20px; font-weight: 700; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .grand-total { font-size: 18px; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SPORTS STATION</div>
          <div style="font-size: 12px; color: #64748b;">Central Warehouse &amp; Operations: Sahid Sudirman Center, Jakarta Pusat</div>
        </div>
        <div>
          <div class="invoice-title">OFFICIAL INVOICE</div>
          <div style="font-size: 13px; color: #64748b;">Nomor: <strong>${order.id}</strong></div>
          <div style="font-size: 12px; color: #64748b;">Tanggal: ${order.displayDate || order.date}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px;">
        <div>
          <strong>Tujuan Pengiriman:</strong><br>
          ${order.customer ? order.customer.name : 'Pelanggan'}<br>
          ${order.customer ? order.customer.phone : '-'}<br>
          ${order.customer ? order.customer.address : '-'}
        </div>
        <div style="text-align: right;">
          <strong>Kurir &amp; Pembayaran:</strong><br>
          Ekspedisi: ${order.courier || 'JNE Reguler'}<br>
          No. Resi: ${order.trackingNumber || '-'}<br>
          Metode Bayar: ${order.paymentMethod || 'Midtrans Gateway'}<br>
          Status: <strong style="color: #16a34a;">PAID (LUNAS)</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Deskripsi Produk</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Harga Satuan</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal Produk:</span>
          <span>${formatRupiah((order.total || 0) - (order.shippingFee || order.courierPrice || 0))}</span>
        </div>
        <div class="total-row">
          <span>Ongkos Kirim:</span>
          <span>${formatRupiah(order.shippingFee || order.courierPrice || 12000)}</span>
        </div>
        <div class="total-row grand-total">
          <span>Total Tagihan:</span>
          <span>${formatRupiah(order.total)}</span>
        </div>
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 16px;">
        Terima kasih telah berbelanja di Sports Station Official Indonesia.<br>
        Dokumen ini diterbitkan otomatis oleh Sports Station Central Management System.
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Helper: Format Rupiah
 */
function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function getStatusBadgeClass(status) {
  const s = String(status).toLowerCase();
  if (s.includes('menunggu')) return 'status-menunggu-pembayaran';
  if (s.includes('proses')) return 'status-diproses';
  if (s.includes('kirim')) return 'status-dikirim';
  if (s.includes('selesai')) return 'status-selesai';
  return 'status-diproses';
}

// Global exposes for inline clicks
window.updateOrderStatus = updateOrderStatus;
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
    stock: 40,
    sizeStock: { 'S': 8, 'M': 14, 'L': 12, 'XL': 6 },
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
    stock: 22,
    sizeStock: { 'S': 4, 'M': 8, 'L': 7, 'XL': 3 },
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
    stock: 25,
    sizeStock: { 'All Size': 25 },
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
    stock: 45,
    sizeStock: { 'M': 20, 'L': 25 },
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
    stock: 28,
    sizeStock: { '36': 4, '37': 8, '38': 8, '39': 5, '40': 3 },
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
    stock: 22,
    sizeStock: { '36': 3, '37': 6, '38': 7, '39': 4, '40': 2 },
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
    stock: 30,
    sizeStock: { '36': 4, '37': 8, '38': 10, '39': 6, '40': 2 },
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
    stock: 35,
    sizeStock: { '39': 4, '40': 8, '41': 12, '42': 8, '43': 3 },
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
    stock: 25,
    sizeStock: { '30': 4, '31': 5, '32': 6, '33': 6, '34': 4 },
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
    stock: 30,
    sizeStock: { 'All Size': 30 },
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
    stock: 60,
    sizeStock: { 'M': 30, 'L': 30 },
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
    stock: 26,
    sizeStock: { '39': 4, '40': 7, '41': 8, '42': 5, '43': 2 },
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
    stock: 30,
    sizeStock: { '40': 6, '41': 10, '42': 10, '43': 4 },
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
    stock: 28,
    sizeStock: { '36': 4, '37': 7, '38': 9, '39': 5, '40': 3 },
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
    stock: 32,
    sizeStock: { 'S': 6, 'M': 12, 'L': 10, 'XL': 4 },
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
    stock: 40,
    sizeStock: { 'S': 8, 'M': 16, 'L': 12, 'XL': 4 },
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
    stock: 20,
    sizeStock: { '39': 3, '40': 6, '41': 6, '42': 4, '43': 1 },
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
    stock: 18,
    sizeStock: { '40': 4, '41': 6, '42': 5, '43': 3 },
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
    stock: 25,
    sizeStock: { '40': 5, '41': 8, '42': 8, '43': 4 },
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
    stock: 50,
    sizeStock: { 'S': 10, 'M': 18, 'L': 14, 'XL': 8 },
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
    stock: 40,
    sizeStock: { 'All Size': 40 },
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
    stock: 22,
    sizeStock: { '39': 3, '40': 6, '41': 7, '42': 4, '43': 2 },
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
    stock: 26,
    sizeStock: { '36': 3, '37': 7, '38': 8, '39': 5, '40': 3 },
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
    stock: 16,
    sizeStock: { '40': 3, '41': 6, '42': 5, '43': 2 },
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
    stock: 20,
    sizeStock: { '39': 2, '40': 6, '41': 7, '42': 4, '43': 1 },
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
    stock: 24,
    sizeStock: { '40': 5, '41': 8, '42': 8, '43': 3 },
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
    stock: 35,
    sizeStock: { '39': 5, '40': 10, '41': 10, '42': 7, '43': 3 },
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
    stock: 25,
    sizeStock: { '36': 4, '37': 7, '38': 8, '39': 4, '40': 2 },
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
    stock: 30,
    sizeStock: { '38': 5, '39': 8, '40': 8, '41': 6, '42': 3 },
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
    stock: 20,
    sizeStock: { 'All Size': 20 },
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
    stock: 30,
    sizeStock: { '39': 5, '40': 10, '41': 8, '42': 5, '43': 2 },
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
    stock: 25,
    sizeStock: { '40': 6, '41': 8, '42': 7, '43': 4 },
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
    stock: 28,
    sizeStock: { '39': 4, '40': 8, '41': 8, '42': 5, '43': 3 },
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
    stock: 24,
    sizeStock: { '36': 4, '37': 6, '38': 8, '39': 4, '40': 2 },
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
    stock: 22,
    sizeStock: { '36': 3, '37': 6, '38': 7, '39': 4, '40': 2 },
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
    stock: 32,
    sizeStock: { '39': 4, '40': 10, '41': 10, '42': 6, '43': 2 },
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
    stock: 35,
    sizeStock: { '39': 5, '40': 10, '41': 10, '42': 7, '43': 3 },
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
    stock: 28,
    sizeStock: { '39': 5, '40': 8, '41': 8, '42': 5, '43': 2 },
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

function loadCatalogProducts() {
  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    if (raw) {
      catalogProducts = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading SportsStationCatalog:', e);
    catalogProducts = [];
  }

  if (!catalogProducts || catalogProducts.length === 0) {
    catalogProducts = [...DEFAULT_CATALOG];
    saveCatalogToStorage();
  } else {
    let modified = false;

    // Merge authentic Sports Station products that do not exist yet in stored catalog
    DEFAULT_CATALOG.forEach(defProd => {
      const exists = catalogProducts.some(p => p.id === defProd.id);
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
  localStorage.setItem('SportsStationCatalog', JSON.stringify(catalogProducts));
  window.dispatchEvent(new Event('storage'));
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

  // Live image preview in form
  const imgInput = document.getElementById('prodImageInput');
  const imgPreview = document.getElementById('prodImagePreview');
  if (imgInput && imgPreview) {
    imgInput.addEventListener('input', () => {
      const url = imgInput.value.trim();
      imgPreview.src = url || 'Asset/Logo/logo.png';
    });
  }

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

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

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
    filtered = filtered.filter(p => (p.category || '').toLowerCase() === productCategoryFilter);
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
  const isFootwearCat = ['running', 'lifestyle', 'basketball', 'football', 'training', 'badminton', 'tennis', 'sandals'].includes(cat);
  const isApparelCat = ['tshirt', 'shorts', 'pants', 'sports-bra', 'jacket', 'tanktop', 'swimwear'].includes(cat);

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

  if (!modal) return;

  if (productId) {
    // Edit Mode
    const prod = catalogProducts.find(p => p.id === productId);
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

    imgInput.value = prod.image || '';
    imgPreview.src = prod.image || 'Asset/Logo/logo.png';

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

    imgInput.value = 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif';
    imgPreview.src = 'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif';

    const tagInput = document.getElementById('prodTagInput');
    if (tagInput) tagInput.value = 'NEW';

    // Default sizes for running shoes
    currentModalSizeStock = { '38': 4, '39': 8, '40': 10, '41': 12, '42': 10, '43': 7, '44': 4, '45': 2 };
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
  const image = document.getElementById('prodImageInput').value.trim() || 'Asset/Logo/logo.png';

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

  if (id) {
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
    }
    let placementNotice = '';
    if (discount >= 50) {
      placementNotice = ' 🏷️ Otomatis masuk rak Sale 50% Beranda!';
    } else if (prod.tag && prod.tag.toUpperCase() === 'NEW') {
      placementNotice = ' ✨ Tampil di rak Newest Collection selama 7 hari.';
    } else if (prod.tag === '') {
      placementNotice = ' ℹ️ Tag dihapus (dikeluarkan dari rak Newest Collection).';
    }
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast(`Produk "${name}" berhasil diperbarui dengan ${totalStock} unit stok.${placementNotice}`);
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

  saveCatalogToStorage();
  const savedProd = isEditing ? catalogProducts.find(p => p.id === currentEditingProductId) : catalogProducts[0];
  if (window.SportsStationDB && savedProd) {
    window.SportsStationDB.upsertProduct(savedProd);
  }
  renderProductsTable();
  closeProductModal();
}

function deleteProduct(productId) {
  const prod = catalogProducts.find(p => p.id === productId);
  if (!prod) return;

  if (confirm(`Apakah Anda yakin ingin menghapus produk "${prod.name}" dari katalog toko?`)) {
    catalogProducts = catalogProducts.filter(p => p.id !== productId);
    saveCatalogToStorage();
    if (window.SportsStationDB) {
      window.SportsStationDB.deleteProduct(productId);
    }
    renderProductsTable();
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast(`Produk "${prod.name}" berhasil dihapus.`);
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
