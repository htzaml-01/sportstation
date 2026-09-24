/**
 * SPORTS STATION - CART SERVICE
 * Handles persistent cart storage, real-time calculations, and UI badge updates.
 */

(function () {
  const CART_STORAGE_KEY = 'sportsstation_cart';

  /**
   * Get all cart items
   * @returns {Array}
   */
  function getCart() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Clean out any old sample dummy items if present
        const filtered = parsed.filter(item => !String(item.cartId).startsWith('cart-sample-'));
        if (filtered.length !== parsed.length) {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
        }
        return filtered;
      }
      return [];
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  }

  /**
   * Save cart items
   */
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      updateBadges();
      window.dispatchEvent(new CustomEvent('sportsstation_cart_updated', { detail: { cart } }));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  /**
   * Add a product to cart
   */
  function addItem(itemData) {
    const cart = getCart();
    const size = itemData.size || 'US 9';
    const color = itemData.color || 'Standard';

    // Find if same item with same size already exists
    const existingIndex = cart.findIndex(
      (item) => item.id === itemData.id && item.size === size
    );

    if (existingIndex > -1) {
      cart[existingIndex].qty += (itemData.qty || 1);
      cart[existingIndex].selected = true; // Auto select added item
    } else {
      const cartId = 'cart-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      cart.push({
        cartId: cartId,
        id: itemData.id || 'prod-' + Date.now(),
        name: itemData.name || 'Sepatu Olahraga Sports Station',
        sku: itemData.sku || '0888-SS' + Math.floor(10000000 + Math.random() * 90000000),
        brand: itemData.brand || 'Sports Station',
        price: Number(itemData.price) || 0,
        originalPrice: Number(itemData.originalPrice) || Number(itemData.price) || 0,
        discount: Number(itemData.discount) || 0,
        image: itemData.image || 'Asset/Logo/logo.png',
        size: size,
        color: color,
        qty: itemData.qty || 1,
        selected: true,
        stockWarning: itemData.stockWarning || ''
      });
    }

    saveCart(cart);
    return cart;
  }

  /**
   * Update quantity of an item
   */
  function updateQty(cartId, delta) {
    const cart = getCart();
    const index = cart.findIndex((item) => item.cartId === cartId);
    if (index > -1) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart);
    }
    return cart;
  }

  /**
   * Remove item from cart
   */
  function removeItem(cartId) {
    const cart = getCart().filter((item) => item.cartId !== cartId);
    saveCart(cart);
    return cart;
  }

  /**
   * Toggle item checkbox selection
   */
  function toggleSelection(cartId) {
    const cart = getCart();
    const item = cart.find((i) => i.cartId === cartId);
    if (item) {
      item.selected = !item.selected;
      saveCart(cart);
    }
    return cart;
  }

  /**
   * Select or deselect all items
   */
  function selectAll(isSelected) {
    const cart = getCart().map((item) => ({
      ...item,
      selected: Boolean(isSelected)
    }));
    saveCart(cart);
    return cart;
  }

  /**
   * Calculate summary of selected items
   */
  function getSummary() {
    const cart = getCart();
    const selectedItems = cart.filter((i) => i.selected);

    let subtotal = 0;
    let totalDiscount = 0;
    let selectedCount = 0;

    selectedItems.forEach((item) => {
      selectedCount += item.qty;
      const itemOrigTotal = item.originalPrice * item.qty;
      const itemActualTotal = item.price * item.qty;
      subtotal += itemActualTotal;

      if (item.originalPrice > item.price) {
        totalDiscount += (itemOrigTotal - itemActualTotal);
      }
    });

    // Final total calculation:
    // If discount was explicitly set or if subtotal was used
    const total = subtotal;

    return {
      totalItems: cart.reduce((sum, i) => sum + i.qty, 0),
      selectedCount: selectedCount,
      subtotal: subtotal + totalDiscount, // Gross subtotal before discount
      discount: totalDiscount,
      total: total,
      isAllSelected: cart.length > 0 && cart.every((i) => i.selected)
    };
  }

  /**
   * Update all cart counter badges in headers
   */
  function updateBadges() {
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const badges = document.querySelectorAll('#cartCount, .cart-badge');
    badges.forEach((badge) => {
      badge.textContent = totalQty;
    });
  }

  // Format currency helper (Rp 639.200)
  function formatRupiah(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }

  // Expose Cart API
  window.SportsStationCart = {
    getCart,
    saveCart,
    addItem,
    updateQty,
    removeItem,
    toggleSelection,
    selectAll,
    getSummary,
    updateBadges,
    formatRupiah
  };

  // Sync badges on load & on cross-tab storage changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateBadges);
  } else {
    updateBadges();
  }

  window.addEventListener('storage', (e) => {
    if (e.key === CART_STORAGE_KEY) {
      updateBadges();
      window.dispatchEvent(new CustomEvent('sportsstation_cart_updated', { detail: { cart: getCart() } }));
    }
  });
})();
