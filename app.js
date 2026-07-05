const API_BASE = (() => {
  // If you're serving frontend via a static server from project root,
  // this lets it call the backend running at :5000.
  // Override by setting window.API_BASE.
  return window.API_BASE || 'http://localhost:5000';
})();

const state = {
  cart: new Map(), // productId -> qty
  products: [],
};

const $ = (sel) => document.querySelector(sel);

const el = {
  productsGrid: $('#productsGrid'),
  resultInfo: $('#resultInfo'),

  searchInput: $('#searchInput'),
  categorySelect: $('#categorySelect'),
  sortSelect: $('#sortSelect'),

  applyFiltersBtn: $('#applyFiltersBtn'),
  clearFiltersBtn: $('#clearFiltersBtn'),
  refreshBtn: $('#refreshBtn'),

  cartDrawer: $('#cartDrawer'),
  backdrop: $('#backdrop'),
  openCartBtn: $('#openCartBtn'),
  closeCartBtn: $('#closeCartBtn'),

  cartItems: $('#cartItems'),
  emptyState: $('#emptyState'),
  cartCount: $('#cartCount'),

  subtotal: $('#subtotal'),
  delivery: $('#delivery'),
  grandTotal: $('#grandTotal'),

  checkoutForm: $('#checkoutForm'),
  checkoutBtn: $('#checkoutBtn'),
  checkoutMsg: $('#checkoutMsg'),
};

const DELIVERY_FEE = 2.49;

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function computeCartCount() {
  let count = 0;
  for (const qty of state.cart.values()) count += qty;
  return count;
}

function getProductsById() {
  const map = new Map();
  for (const p of state.products) map.set(p.id, p);
  return map;
}

function computeSubtotal() {
  const map = getProductsById();
  let subtotal = 0;
  for (const [pid, qty] of state.cart.entries()) {
    const p = map.get(pid);
    if (!p) continue;
    subtotal += Number(p.price) * qty;
  }
  return subtotal;
}

function sortedProducts(items) {
  const sort = el.sortSelect.value;
  const arr = [...items];
  if (sort === 'price_asc') arr.sort((a,b) => a.price - b.price);
  else if (sort === 'price_desc') arr.sort((a,b) => b.price - a.price);
  else arr.sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0));
  return arr;
}

async function fetchProducts() {
  const category = el.categorySelect.value;
  const q = el.searchInput.value.trim();
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (q) params.set('q', q);

  const url = `${API_BASE}/api/products?${params.toString()}`;

  el.resultInfo.textContent = 'Loading…';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load products');
  const data = await res.json();
  state.products = data.items || [];

  const items = sortedProducts(state.products);
  renderProducts(items);

  el.resultInfo.textContent = `${items.length} item(s)`;
}

function renderProducts(items) {
  el.productsGrid.innerHTML = '';

  for (const p of items) {
    const tags = (p.tags || []).slice(0, 3);

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'listitem');

    const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    card.innerHTML = `
      <div class="img" style="background-image:url('${p.image}')"></div>
      <div class="body">
        <div class="meta-row">
          <h4>${escapeHtml(p.name)}</h4>
          <span class="badge">⭐ ${Number(p.rating ?? 0).toFixed(1)}</span>
        </div>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="tags">${tagsHtml}</div>
      </div>
      <div class="actions">
        <div class="price">${formatMoney(p.price)}</div>
        <button class="btn btn-primary" type="button" data-add="${p.id}">
          Add
        </button>
      </div>
    `;

    card.querySelector('[data-add]').addEventListener('click', () => addToCart(p.id));

    el.productsGrid.appendChild(card);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function addToCart(productId, qty = 1) {
  const prev = state.cart.get(productId) || 0;
  state.cart.set(productId, prev + qty);
  renderCart();
}

function setQty(productId, qty) {
  if (qty <= 0) state.cart.delete(productId);
  else state.cart.set(productId, qty);
  renderCart();
}

function renderCart() {
  el.cartItems.innerHTML = '';

  const count = computeCartCount();
  el.cartCount.textContent = count;

  if (count === 0) {
    el.emptyState.hidden = false;
  } else {
    el.emptyState.hidden = true;
  }

  const map = getProductsById();
  for (const [pid, qty] of state.cart.entries()) {
    const p = map.get(pid);
    if (!p) continue;

    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <div class="thumb" style="background-image:url('${p.image}')"></div>
      <div>
        <div class="title">${escapeHtml(p.name)}</div>
        <div class="sub">${formatMoney(p.price)} • line ${formatMoney(p.price * qty)}</div>
      </div>
      <div class="qty-controls" aria-label="Quantity controls">
        <button type="button" data-dec="${pid}" aria-label="Decrease">−</button>
        <b aria-live="polite">${qty}</b>
        <button type="button" data-inc="${pid}" aria-label="Increase">+</button>
      </div>
    `;

    item.querySelector(`[data-dec="${pid}"]`).addEventListener('click', () => setQty(pid, qty - 1));
    item.querySelector(`[data-inc="${pid}"]`).addEventListener('click', () => setQty(pid, qty + 1));

    el.cartItems.appendChild(item);
  }

  const subtotal = computeSubtotal();
  const grandTotal = subtotal + (count > 0 ? DELIVERY_FEE : 0);

  el.subtotal.textContent = formatMoney(subtotal);
  el.delivery.textContent = count > 0 ? formatMoney(DELIVERY_FEE) : formatMoney(0);
  el.grandTotal.textContent = formatMoney(grandTotal);

  const canCheckout = count > 0;
  el.checkoutBtn.disabled = !canCheckout;
  if (!canCheckout) el.checkoutMsg.textContent = '';
}

function openCart() {
  el.cartDrawer.hidden = false;
  el.backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  el.cartDrawer.hidden = true;
  el.backdrop.hidden = true;
  document.body.style.overflow = '';
}

async function submitCheckout(e) {
  e.preventDefault();
  const count = computeCartCount();
  if (count === 0) return;

  el.checkoutBtn.disabled = true;
  el.checkoutMsg.textContent = 'Placing order…';

  const form = new FormData(el.checkoutForm);
  const payload = {
    name: String(form.get('name') || '').trim(),
    phone: String(form.get('phone') || '').trim(),
    address: String(form.get('address') || '').trim(),
    cart: [...state.cart.entries()].map(([productId, qty]) => ({ productId, qty })),
  };

  try {
    const res = await fetch(`${API_BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const msg = data?.error || 'Checkout failed';
      el.checkoutMsg.textContent = `❌ ${msg}`;
      return;
    }

    el.checkoutMsg.textContent = `✅ ${data.message} (Order: ${data.orderId})`;
    // Clear cart after success
    state.cart.clear();
    el.checkoutForm.reset();
    renderCart();
    setTimeout(() => (el.checkoutMsg.textContent = ''), 5000);
  } catch (err) {
    el.checkoutMsg.textContent = `❌ ${err?.message || 'Network error'}`;
  } finally {
    // Re-enable only if cart has items (it will be cleared on success)
    const c = computeCartCount();
    el.checkoutBtn.disabled = c === 0;
  }
}

function clearFilters() {
  el.searchInput.value = '';
  el.categorySelect.value = '';
  el.sortSelect.value = 'rating_desc';
}

// Events
el.applyFiltersBtn.addEventListener('click', async () => {
  try {
    await fetchProducts();
  } catch {
    el.resultInfo.textContent = 'Failed to load products';
  }
});

el.clearFiltersBtn.addEventListener('click', async () => {
  clearFilters();
  try {
    await fetchProducts();
  } catch {
    el.resultInfo.textContent = 'Failed to load products';
  }
});

el.sortSelect.addEventListener('change', () => {
  const items = sortedProducts(state.products);
  renderProducts(items);
  el.resultInfo.textContent = `${items.length} item(s)`;
});

el.refreshBtn.addEventListener('click', async () => {
  try {
    await fetchProducts();
  } catch {
    el.resultInfo.textContent = 'Failed to load products';
  }
});

el.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.applyFiltersBtn.click();
});

el.openCartBtn.addEventListener('click', openCart);
el.closeCartBtn.addEventListener('click', closeCart);

el.backdrop.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.cartDrawer.hidden) closeCart();
});

el.checkoutForm.addEventListener('submit', submitCheckout);

// Init
(async function init() {
  try {
    renderCart();
    await fetchProducts();
  } catch (err) {
    el.resultInfo.textContent = 'Backend not running. Start app.py on port 5000.';
    console.error(err);
  }
})();

