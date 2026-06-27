function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const payBtn = document.getElementById('pay-now-btn');
  const printBtn = document.getElementById('print-bill-btn');
  const clearBtn = document.getElementById('clear-cart-btn');

  const items = getCart();
  const total = getCartTotal();
  const count = getCartItemCount();

  if (cartCountEl) cartCountEl.textContent = count;
  if (cartTotalEl) cartTotalEl.textContent = formatCurrency(total);

  const hasItems = items.length > 0;
  if (payBtn) payBtn.disabled = !hasItems;
  if (printBtn) printBtn.disabled = !hasItems;
  if (clearBtn) clearBtn.disabled = !hasItems;

  if (!cartItemsEl) return;

  if (!hasItems) {
    cartItemsEl.innerHTML = '<p class="empty-msg">Click a menu item to add it here.</p>';
    updatePrintBill();
    return;
  }

  cartItemsEl.innerHTML = items
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image ? menuImageUrl(item.image) : 'images/placeholder.svg'}" alt="" class="cart-item-thumb" onerror="this.src='images/placeholder.svg'">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${formatCurrency(item.price)} each</span>
      </div>
      <div class="cart-item-controls">
        <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease">−</button>
        <span class="cart-item-qty">${item.qty}</span>
        <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase">+</button>
        <span class="cart-item-line-total">${formatCurrency(item.price * item.qty)}</span>
      </div>
    </div>
  `
    )
    .join('');

  cartItemsEl.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      updateQty(id, delta);
      renderCart();
    });
  });

  updatePrintBill();
}

function updatePrintBill(options = {}) {
  const settings = getSettings();
  const items = options.items || getCart();
  const total = options.total != null ? options.total : getCartTotal();
  const now = options.date ? new Date(options.date) : new Date();
  const orderId = options.orderId || '';
  const paid = options.paid || false;

  const nameEl = document.getElementById('print-restaurant-name');
  const dateEl = document.getElementById('print-date');
  const orderIdEl = document.getElementById('print-order-id');
  const statusEl = document.getElementById('print-status');
  const itemsEl = document.getElementById('print-items');
  const totalEl = document.getElementById('print-total');

  if (nameEl) nameEl.textContent = settings.restaurantName;
  if (dateEl) {
    dateEl.textContent = now.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  if (orderIdEl) {
    orderIdEl.textContent = orderId ? `Order: ${orderId}` : '';
    orderIdEl.hidden = !orderId;
  }
  if (statusEl) {
    statusEl.textContent = paid ? 'PAID' : '';
    statusEl.hidden = !paid;
  }

  if (itemsEl) {
    if (items.length === 0) {
      itemsEl.innerHTML = '<tr><td colspan="3">No items</td></tr>';
    } else {
      itemsEl.innerHTML = items
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>${formatCurrency(item.price * item.qty)}</td>
        </tr>
      `
        )
        .join('');
    }
  }

  if (totalEl) totalEl.textContent = formatCurrency(total);
}

function printReceipt(options = {}) {
  updatePrintBill(options);
  window.print();
}

function openPayModal() {
  const items = getCart();
  if (items.length === 0) return;

  const modal = document.getElementById('pay-modal');
  const totalEl = document.getElementById('pay-total');
  const orderIdEl = document.getElementById('pay-order-id');

  const total = getCartTotal();
  const orderId = generateOrderId();

  modal.dataset.orderId = orderId;
  totalEl.textContent = formatCurrency(total);
  orderIdEl.textContent = orderId;

  const qrWrapper = document.querySelector('.qr-wrapper');
  qrWrapper.innerHTML = '<canvas id="qr-canvas"></canvas>';
  const qrCanvas = document.getElementById('qr-canvas');

  const settings = getSettings();
  const upiLink = buildUpiLink(total, orderId);
  const upiIdEl = document.getElementById('pay-upi-id');
  if (upiIdEl) upiIdEl.textContent = settings.upiId;

  renderQrCode(qrCanvas, upiLink).catch(() => {
    qrWrapper.innerHTML =
      '<p class="error-msg">Could not generate QR. Amount: ' + formatCurrency(total) + '</p>';
  });

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closePayModal() {
  const modal = document.getElementById('pay-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function markAsPaid() {
  const modal = document.getElementById('pay-modal');
  const orderId = modal.dataset.orderId;
  const items = getCartSnapshot();
  const total = getCartTotal();

  if (items.length === 0) return;

  const paidAt = new Date().toISOString();

  saveOrder({
    id: orderId,
    items,
    total,
    status: 'paid',
    date: paidAt,
  });

  closePayModal();
  showToast('Payment recorded! Printing bill…');

  printReceipt({
    orderId,
    items,
    total,
    date: paidAt,
    paid: true,
  });

  clearCart();
  renderCart();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function refreshMenu() {
  const menuGrid = document.getElementById('menu-grid');
  renderMenuGrid(menuGrid, (item) => {
    addToCart(item);
    renderCart();
    showToast(item.name + ' added to cart');
  });
}

function initBillingPage() {
  const settings = getSettings();
  document.getElementById('restaurant-name').textContent = settings.restaurantName;
  document.title = settings.restaurantName + ' — Billing';

  const categoryFilters = document.getElementById('category-filters');
  renderCategoryFilters(categoryFilters, refreshMenu);

  document.getElementById('menu-search').addEventListener('input', (e) => {
    setMenuFilters({ search: e.target.value.trim() });
    refreshMenu();
  });

  refreshMenu();
  renderCart();

  document.getElementById('clear-cart-btn').addEventListener('click', () => {
    if (getCart().length === 0) return;
    if (confirm('Clear all items from the cart?')) {
      clearCart();
      renderCart();
    }
  });

  document.getElementById('pay-now-btn').addEventListener('click', openPayModal);
  document.getElementById('print-bill-btn').addEventListener('click', () => window.print());

  document.getElementById('close-pay-modal').addEventListener('click', closePayModal);
  document.getElementById('mark-paid-btn').addEventListener('click', markAsPaid);

  document.getElementById('pay-modal').addEventListener('click', (e) => {
    if (e.target.id === 'pay-modal') closePayModal();
  });
}

document.addEventListener('DOMContentLoaded', initBillingPage);
