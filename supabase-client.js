/**
 * SPORTS STATION - SUPABASE CLIENT & DATA ADAPTER
 * 
 * Modul ini menyediakan integrasi langsung ke Supabase Cloud Database.
 * Dilengkapi dengan Hybrid Fallback ke localStorage jika Supabase belum dikonfigurasi / offline,
 * sehingga aplikasi tidak akan pernah crash dan tetap berjalan 100% mulus.
 */

// ============================================================================
// 1. KONFIGURASI SUPABASE (Isi URL & Anon Key dari Dashboard Supabase kamu)
// ============================================================================
window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
  url: localStorage.getItem('SUPABASE_URL') || 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: localStorage.getItem('SUPABASE_ANON_KEY') || 'YOUR_SUPABASE_ANON_KEY'
};

let _supabaseInstance = null;

/**
 * Cek apakah Supabase sudah dikonfigurasi dengan URL & Key yang valid
 */
function isSupabaseConfigured() {
  const cfg = window.SUPABASE_CONFIG;
  return Boolean(
    window.supabase &&
    cfg &&
    cfg.url &&
    !cfg.url.includes('YOUR_PROJECT_ID') &&
    cfg.anonKey &&
    !cfg.anonKey.includes('YOUR_SUPABASE_ANON_KEY')
  );
}

/**
 * Mendapatkan Supabase Client instance (Singleton)
 */
function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!_supabaseInstance) {
    try {
      _supabaseInstance = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
      );
      console.log('✅ Supabase Client initialized successfully');
    } catch (e) {
      console.warn('⚠️ Gagal inisialisasi Supabase client:', e);
      return null;
    }
  }
  return _supabaseInstance;
}

// ============================================================================
// 2. MAPPER DATA (Supabase snake_case <-> Frontend camelCase)
// ============================================================================

function mapProductFromDB(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    gender: row.gender || 'unisex',
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price || row.price),
    discount: Number(row.discount || 0),
    stock: Number(row.stock || 0),
    sizeStock: row.size_stock || {},
    isSale: Boolean(row.is_sale),
    tag: row.tag || '',
    rating: Number(row.rating || 4.8),
    reviewsCount: Number(row.reviews_count || 12),
    image: row.image,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function mapProductToDB(prod) {
  return {
    id: prod.id,
    name: prod.name,
    brand: prod.brand,
    gender: prod.gender || 'unisex',
    category: prod.category,
    price: Math.round(Number(prod.price) || 0),
    original_price: Math.round(Number(prod.originalPrice || prod.price) || 0),
    discount: Math.round(Number(prod.discount) || 0),
    stock: Number(prod.stock) || 0,
    size_stock: prod.sizeStock || {},
    is_sale: Boolean(prod.isSale || prod.discount > 0),
    tag: prod.tag || '',
    image: prod.image,
    created_at: prod.createdAt || new Date().toISOString()
  };
}

function mapOrderFromDB(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.shipping_address
    },
    courier: row.shipping_courier,
    trackingNumber: row.tracking_number,
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    shippingCost: Number(row.shipping_cost || 0),
    total: Number(row.total_amount || 0),
    paymentMethod: row.payment_method || 'Midtrans',
    status: row.payment_status || 'pending',
    snapToken: row.snap_token,
    date: row.created_at,
    displayDate: new Date(row.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  };
}

// ============================================================================
// 3. API PRODUK (Async CRUD)
// ============================================================================

/**
 * Mengambil semua produk dari Supabase (atau fallback ke localStorage)
 */
async function fetchProductsFromDB() {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map(mapProductFromDB);
        // Cache ke localStorage agar offline tetap instan
        localStorage.setItem('SportsStationCatalog', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('⚠️ Gagal mengambil produk dari Supabase, memakai localStorage cache:', err.message);
    }
  }

  // Fallback: localStorage
  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Menyimpan / memperbarui produk ke Supabase & localStorage
 */
async function upsertProductToDB(product) {
  // Simpan ke local cache dulu
  let localList = [];
  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    localList = raw ? JSON.parse(raw) : [];
    const idx = localList.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      localList[idx] = { ...product };
    } else {
      localList.unshift({ ...product });
    }
    localStorage.setItem('SportsStationCatalog', JSON.stringify(localList));
  } catch (e) {
    console.error('Local save error', e);
  }

  // Sync ke Supabase
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const dbPayload = mapProductToDB(product);
      const { error } = await sb.from('products').upsert(dbPayload, { onConflict: 'id' });
      if (error) throw error;
      console.log('✅ Produk tersimpan di Supabase:', product.id);
    } catch (err) {
      console.warn('⚠️ Gagal sync produk ke Supabase:', err.message);
    }
  }
}

/**
 * Menghapus produk dari Supabase & localStorage
 */
async function deleteProductFromDB(productId) {
  // Hapus dari local cache
  try {
    const raw = localStorage.getItem('SportsStationCatalog');
    if (raw) {
      const list = JSON.parse(raw).filter(p => p.id !== productId);
      localStorage.setItem('SportsStationCatalog', JSON.stringify(list));
    }
  } catch (e) {
    console.error('Local delete error', e);
  }

  // Hapus dari Supabase
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { error } = await sb.from('products').delete().eq('id', productId);
      if (error) throw error;
      console.log('✅ Produk terhapus dari Supabase:', productId);
    } catch (err) {
      console.warn('⚠️ Gagal hapus produk dari Supabase:', err.message);
    }
  }
}

// ============================================================================
// 4. API PESANAN (ORDERS & MIDTRANS SYNC)
// ============================================================================

/**
 * Mengambil seluruh daftar pesanan
 */
async function fetchOrdersFromDB() {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mapped = data.map(mapOrderFromDB);
        localStorage.setItem('SportsStationOrders', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('⚠️ Gagal mengambil pesanan dari Supabase, memakai localStorage:', err.message);
    }
  }

  try {
    const raw = localStorage.getItem('SportsStationOrders');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Membuat pesanan baru ke Supabase & kurangi stok
 */
async function createOrderInDB(orderData) {
  // Simpan ke localStorage
  try {
    const raw = localStorage.getItem('SportsStationOrders');
    const orders = raw ? JSON.parse(raw) : [];
    orders.unshift(orderData);
    localStorage.setItem('SportsStationOrders', JSON.stringify(orders));
  } catch (e) {
    console.error('Local order save error', e);
  }

  // Simpan ke Supabase
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const payload = {
        id: orderData.id,
        customer_name: orderData.customer ? orderData.customer.name : 'Customer',
        customer_email: orderData.customer ? orderData.customer.email : '',
        customer_phone: orderData.customer ? orderData.customer.phone : '',
        shipping_address: orderData.customer ? orderData.customer.address : '',
        shipping_courier: orderData.courier || '',
        tracking_number: orderData.trackingNumber || '',
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        shipping_cost: orderData.shippingCost || 0,
        total_amount: orderData.total || 0,
        payment_method: orderData.paymentMethod || 'Midtrans',
        payment_status: orderData.status || 'pending',
        snap_token: orderData.snapToken || null
      };

      const { error } = await sb.from('orders').insert(payload);
      if (error) throw error;
      console.log('✅ Pesanan berhasil dicatat di Supabase:', orderData.id);

      // Otomatis update stok di Supabase jika ada items
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const it of orderData.items) {
          await decrementProductStockInDB(it.id, it.size, it.qty);
        }
      }
    } catch (err) {
      console.warn('⚠️ Gagal sync order ke Supabase:', err.message);
    }
  }
}

/**
 * Kurangi stok di Supabase saat pesanan dibuat
 */
async function decrementProductStockInDB(productId, size, qty) {
  const sb = getSupabaseClient();
  if (!sb) return;

  try {
    const { data: prod, error } = await sb.from('products').select('*').eq('id', productId).single();
    if (error || !prod) return;

    const sizeStock = prod.size_stock || {};
    if (size && sizeStock[size] !== undefined) {
      sizeStock[size] = Math.max(0, Number(sizeStock[size]) - Number(qty));
    }
    const newStock = Object.values(sizeStock).reduce((a, b) => Number(a) + Number(b), 0);

    await sb.from('products').update({
      size_stock: sizeStock,
      stock: newStock
    }).eq('id', productId);
  } catch (e) {
    console.warn('Gagal update stok di Supabase:', e);
  }
}

/**
 * Update status pembayaran pesanan
 */
async function updateOrderStatusInDB(orderId, newStatus) {
  // Update local
  try {
    const raw = localStorage.getItem('SportsStationOrders');
    if (raw) {
      const orders = JSON.parse(raw);
      const target = orders.find(o => o.id === orderId);
      if (target) {
        target.status = newStatus;
        localStorage.setItem('SportsStationOrders', JSON.stringify(orders));
      }
    }
  } catch (e) {}

  // Update Supabase
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('orders').update({ payment_status: newStatus }).eq('id', orderId);
      console.log('✅ Status order diupdate di Supabase:', orderId, newStatus);
    } catch (e) {
      console.warn('Gagal update status di Supabase:', e);
    }
  }
}

// ============================================================================
// 5. EXPORT KE GLOBAL SCOPE
// ============================================================================
window.SportsStationDB = {
  isConfigured: isSupabaseConfigured,
  getClient: getSupabaseClient,
  fetchProducts: fetchProductsFromDB,
  upsertProduct: upsertProductToDB,
  deleteProduct: deleteProductFromDB,
  fetchOrders: fetchOrdersFromDB,
  createOrder: createOrderInDB,
  updateOrderStatus: updateOrderStatusInDB
};
