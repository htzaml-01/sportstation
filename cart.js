/**
 * SPORTS STATION - CART PAGE CONTROLLER
 * Renders dynamic cart items, manages checkboxes, quantity adjustments, and order summary.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCartView();

  // Listen for storage or external updates
  window.addEventListener('sportsstation_cart_updated', () => {
    renderCartView();
  });
});

function renderCartView() {
  const container = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('cartEmptyState');
  const selectAllRow = document.getElementById('cartSelectAllRow');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const summaryBox = document.getElementById('cartSummaryCard');

  if (!container || !window.SportsStationCart) return;

  const cart = window.SportsStationCart.getCart();
  const summary = window.SportsStationCart.getSummary();

  // Handle empty cart
  if (cart.length === 0) {
    container.style.display = 'none';
    if (selectAllRow) selectAllRow.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    updateSummaryUI(summary);
    return;
  }

  container.style.display = 'flex';
  if (selectAllRow) selectAllRow.style.display = 'flex';
  if (emptyState) emptyState.style.display = 'none';

  // Update "All Products" checkbox state
  if (selectAllCheckbox) {
    if (summary.isAllSelected) {
      selectAllCheckbox.classList.add('checked');
    } else {
      selectAllCheckbox.classList.remove('checked');
    }

    selectAllCheckbox.onclick = () => {
      const willSelect = !selectAllCheckbox.classList.contains('checked');
      window.SportsStationCart.selectAll(willSelect);
      renderCartView();
    };
  }

  // Render Cart Item Cards
  container.innerHTML = cart.map((item) => {
    const isChecked = item.selected;
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const itemTotal = item.price * item.qty;
    const itemOrigTotal = item.originalPrice * item.qty;

    return `
      <div class="cart-item-card" data-cart-id="${item.cartId}">
        <!-- Checkbox -->
        <div class="cart-item-checkbox-wrap">
          <div class="custom-cart-checkbox ${isChecked ? 'checked' : ''}" 
               onclick="window.SportsStationCart.toggleSelection('${item.cartId}'); renderCartView();"
               title="${isChecked ? 'Batal pilih' : 'Pilih produk'}">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>

        <!-- Product Image -->
        <div class="cart-item-img-wrap">
          <a href="product-detail.html?id=${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='Asset/Logo/logo.png'">
          </a>
        </div>

        <!-- Details -->
        <div class="cart-item-details">
          <a href="product-detail.html?id=${item.id}" class="cart-item-name">${item.name}</a>
          <span class="cart-item-sku">${item.sku || '0888-SS100293'}</span>
          <div class="cart-item-meta">
            ${item.size ? `<span>Ukuran: <strong>${item.size}</strong></span>` : ''}
            ${item.color ? `<span>Warna: ${item.color}</span>` : ''}
          </div>
          <button type="button" class="cart-trash-btn" onclick="removeItemWithConfirm('${item.cartId}')" title="Hapus dari keranjang">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>

        <!-- Quantity Control -->
        <div class="cart-item-qty-col">
          <div class="cart-qty-pill">
            <button type="button" class="cart-qty-btn" onclick="window.SportsStationCart.updateQty('${item.cartId}', -1); renderCartView();" ${item.qty <= 1 ? 'title="Kurangi / Hapus"' : ''}>
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="cart-qty-val">${item.qty}</span>
            <button type="button" class="cart-qty-btn" onclick="window.SportsStationCart.updateQty('${item.cartId}', 1); renderCartView();">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          ${item.stockWarning ? `<span class="cart-stock-warning">${item.stockWarning}</span>` : ''}
        </div>

        <!-- Price -->
        <div class="cart-item-price-col">
          <span class="cart-current-price">${window.SportsStationCart.formatRupiah(itemTotal)}</span>
          ${hasDiscount ? `<span class="cart-original-price">${window.SportsStationCart.formatRupiah(itemOrigTotal)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Update Summary Panel
  updateSummaryUI(summary);
}

function updateSummaryUI(summary) {
  const summaryTitle = document.getElementById('summaryTitle');
  const subtotalVal = document.getElementById('summarySubtotal');
  const discountRow = document.getElementById('summaryDiscountRow');
  const discountVal = document.getElementById('summaryDiscount');
  const totalVal = document.getElementById('summaryTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (summaryTitle) {
    summaryTitle.textContent = `Order Summary (${summary.selectedCount} items)`;
  }

  if (subtotalVal) {
    subtotalVal.textContent = window.SportsStationCart.formatRupiah(summary.subtotal);
  }

  if (discountRow && discountVal) {
    if (summary.discount > 0) {
      discountRow.style.display = 'flex';
      discountVal.textContent = `-${window.SportsStationCart.formatRupiah(summary.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (totalVal) {
    totalVal.textContent = window.SportsStationCart.formatRupiah(summary.total);
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = summary.selectedCount === 0;
  }
}

function removeItemWithConfirm(cartId) {
  window.SportsStationCart.removeItem(cartId);
  renderCartView();
  if (window.SportsStationAuth) {
    window.SportsStationAuth.showToast('Produk dihapus dari keranjang.');
  }
}

function handleCheckout() {
  const summary = window.SportsStationCart.getSummary();
  if (summary.selectedCount === 0) {
    if (window.SportsStationAuth) {
      window.SportsStationAuth.showToast('Pilih minimal 1 produk untuk checkout.');
    } else {
      alert('Pilih minimal 1 produk untuk checkout.');
    }
    return;
  }
  window.location.href = 'checkout.html';
}

// Expose to window
window.renderCartView = renderCartView;
window.removeItemWithConfirm = removeItemWithConfirm;
window.handleCheckout = handleCheckout;
