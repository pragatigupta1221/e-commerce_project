/* ============================================================
   script.js — STUB marketplace (single-page, hash-routed)
   Task 1: Listing      -> https://dummyjson.com/products?limit=194
   Task 2: Product page -> https://dummyjson.com/products/{id}
   Task 3: Cart + Bill   -> localStorage
   Routes: #/  |  #/product/:id  |  #/cart
   ============================================================ */

/* ---------------- Currency conversion ----------------
   dummyjson API returns prices in USD. We convert to INR
   once, right after fetching, so every calculation downstream
   (cart totals, tax, bill) already works in real INR values. */
const USD_TO_INR = 83;
function toINR(usd) {
  return +(usd * USD_TO_INR).toFixed(2);
}

/* ---------------- Cart storage (Task 3 helpers, used everywhere) ---------------- */
const CART_KEY = "stub_cart_v1";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not read cart:", e);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      qty: qty,
    });
  }
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
}

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find((item) => item.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = cartCount();
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------------- View elements ---------------- */
const views = {
  listing: document.getElementById("view-listing"),
  product: document.getElementById("view-product"),
  cart: document.getElementById("view-cart"),
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ============================================================
   TASK 1 — Listing page
   ============================================================ */
const LIST_API = "https://dummyjson.com/products?limit=194";
let allProducts = [];

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");

async function loadListing() {
  if (allProducts.length) {
    renderProducts(allProducts);
    return;
  }
  grid.innerHTML = `<p class="state-msg">Loading products…</p>`;
  try {
    const res = await fetch(LIST_API);
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    allProducts = (data.products || []).map((p) => ({ ...p, price: toINR(p.price) }));
    buildCategoryOptions(allProducts);
    renderProducts(allProducts);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="state-msg">Couldn't load products. Check your connection and refresh.</p>`;
  }
}

function buildCategoryOptions(products) {
  const categories = [...new Set(products.map((p) => p.category))].sort();
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function renderProducts(products) {
  if (!products.length) {
    grid.innerHTML = `<p class="state-msg">No products match that search. Try clearing the filters.</p>`;
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
    <article class="card" data-id="${p.id}">
      <div class="card-media" data-go>
        <img src="${p.thumbnail}" alt="${escapeHtml(p.title)}" loading="lazy" />
      </div>
      <div class="card-body" data-go>
        <p class="card-kicker">${escapeHtml(p.category)}</p>
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <p class="card-desc">${escapeHtml(p.description)}</p>
      </div>
      <div class="tear"></div>
      <div class="card-footer">
        <button class="btn btn-pay" data-pay>Pay ₹${p.price}</button>
        <button class="btn btn-cart" data-add>Add to Cart</button>
      </div>
    </article>
  `
    )
    .join("");
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const sortBy = sortSelect.value;

  let filtered = allProducts.filter((p) => {
    const matchesTerm = p.title.toLowerCase().includes(term);
    const matchesCategory = !category || p.category === category;
    return matchesTerm && matchesCategory;
  });

  if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "rating-desc") filtered.sort((a, b) => b.rating - a.rating);

  renderProducts(filtered);
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;
  const product = allProducts.find((p) => String(p.id) === String(id));

  if (e.target.closest("[data-go]")) {
    window.location.hash = `#/product/${id}`;
    return;
  }
  if (e.target.closest("[data-add]")) {
    addToCart(product, 1);
    const btn = e.target.closest("[data-add]");
    btn.textContent = "Added ✓";
    btn.classList.add("is-added");
    showToast(`${product.title} added to cart`);
    setTimeout(() => {
      btn.textContent = "Add to Cart";
      btn.classList.remove("is-added");
    }, 1200);
    return;
  }
  if (e.target.closest("[data-pay]")) {
    addToCart(product, 1);
    window.location.hash = "#/cart";
    return;
  }
});

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

/* ============================================================
   TASK 2 — Product detail page
   ============================================================ */
const productRoot = document.getElementById("productRoot");
let currentProduct = null;
let qty = 1;

async function loadProduct(id) {
  qty = 1;
  productRoot.innerHTML = `<p class="state-msg">Loading product…</p>`;
  try {
    const res = await fetch(`https://dummyjson.com/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    const product = await res.json();
    product.price = toINR(product.price);
    currentProduct = product;
    renderProduct(product);
  } catch (err) {
    console.error(err);
    productRoot.innerHTML = `<p class="state-msg">Couldn't load this product. <a href="#/">Go back</a>.</p>`;
  }
}

function renderProduct(p) {
  const images = p.images && p.images.length ? p.images : [p.thumbnail];
  const hasDiscount = p.discountPercentage && p.discountPercentage > 0;
  const original = hasDiscount ? (p.price / (1 - p.discountPercentage / 100)).toFixed(2) : null;

  productRoot.innerHTML = `
    <div class="product-layout">
      <div>
        <div class="gallery-main">
          <img id="mainImage" src="${images[0]}" alt="${escapeHtml(p.title)}" />
        </div>
        <div class="gallery-thumbs">
          ${images
            .map(
              (img, i) =>
                `<img src="${img}" data-thumb class="${i === 0 ? "active" : ""}" alt="thumbnail ${i + 1}" />`
            )
            .join("")}
        </div>
      </div>

      <div class="product-info">
        <p class="card-kicker">${escapeHtml(p.brand || p.category)}</p>
        <h1>${escapeHtml(p.title)}</h1>
        <div class="rating-row">
          <span class="stars">★ ${p.rating}</span>
          <span>·</span>
          <span>${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
          <span>·</span>
          <span>${escapeHtml(p.category)}</span>
        </div>

        <p class="product-desc">${escapeHtml(p.description)}</p>

        <div class="product-price-row">
          <span class="price">₹${p.price}</span>
          ${original ? `<span class="strike">₹${original}</span>` : ""}
          ${hasDiscount ? `<span class="discount-pill">-${Math.round(p.discountPercentage)}%</span>` : ""}
        </div>

        <div class="meta-grid">
          <div class="meta-cell"><span class="k">Brand</span><span class="v">${escapeHtml(p.brand || "—")}</span></div>
          <div class="meta-cell"><span class="k">Category</span><span class="v">${escapeHtml(p.category)}</span></div>
          <div class="meta-cell"><span class="k">Warranty</span><span class="v">${escapeHtml(p.warrantyInformation || "Standard")}</span></div>
          <div class="meta-cell"><span class="k">Shipping</span><span class="v">${escapeHtml(p.shippingInformation || "Ships in 3–5 days")}</span></div>
        </div>

        <div class="qty-row">
          <span class="card-kicker" style="margin:0">Quantity</span>
          <div class="qty-control">
            <button id="qtyMinus" aria-label="Decrease quantity">−</button>
            <span id="qtyValue">1</span>
            <button id="qtyPlus" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="product-actions">
          <button class="btn btn-pay" id="payBtn">Pay ₹${p.price}</button>
          <button class="btn btn-cart" id="addBtn">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-thumb]").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      document.getElementById("mainImage").src = thumb.src;
      document.querySelectorAll("[data-thumb]").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  document.getElementById("qtyMinus").addEventListener("click", () => updateQtyUI(-1));
  document.getElementById("qtyPlus").addEventListener("click", () => updateQtyUI(1));

  document.getElementById("addBtn").addEventListener("click", () => {
    addToCart(currentProduct, qty);
    showToast(`${qty} × ${currentProduct.title} added to cart`);
  });

  document.getElementById("payBtn").addEventListener("click", () => {
    addToCart(currentProduct, qty);
    window.location.hash = "#/cart";
  });
}

function updateQtyUI(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById("qtyValue").textContent = qty;
  document.getElementById("payBtn").textContent = `Pay ₹${(currentProduct.price * qty).toFixed(2)}`;
}

/* ============================================================
   TASK 3 — Cart page with bill summary
   ============================================================ */
const TAX_RATE = 0.08;
const SHIPPING_FLAT = toINR(4.99);
const FREE_SHIPPING_THRESHOLD = toINR(50);
const cartRoot = document.getElementById("cartRoot");

function renderCartPage() {
  const cart = getCart();

  if (!cart.length) {
    cartRoot.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>No stubs torn off yet. Go find something worth buying.</p>
        <a href="#/" class="btn btn-pay">Browse products</a>
      </div>
    `;
    return;
  }

  const subtotal = cartSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  cartRoot.innerHTML = `
    <div class="cart-layout">
      <section class="cart-list">
        ${cart
          .map(
            (item) => `
          <article class="cart-item" data-id="${item.id}">
            <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" />
            <div>
              <p class="cart-item-title">${escapeHtml(item.title)}</p>
              <p class="cart-item-sub">₹${item.price.toFixed(2)} each</p>
              <div class="qty-control" style="margin-top:8px">
                <button data-minus aria-label="Decrease quantity">−</button>
                <span>${item.qty}</span>
                <button data-plus aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="cart-item-right">
              <span class="cart-item-price">₹${(item.price * item.qty).toFixed(2)}</span>
              <button class="remove-link" data-remove>Remove</button>
            </div>
          </article>
        `
          )
          .join("")}
      </section>

      <aside class="bill">
        <p class="bill-head">Bill summary</p>
        <div class="bill-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="bill-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : "₹" + shipping.toFixed(2)}</span></div>
        <div class="bill-row"><span>Tax (8%)</span><span>₹${tax.toFixed(2)}</span></div>
        <div class="bill-divider"></div>
        <div class="bill-total"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
        <button class="btn btn-pay" id="checkoutBtn">Pay ₹${total.toFixed(2)}</button>
        <p class="bill-note">Tear here — checkout is simulated, no real payment.</p>
      </aside>
    </div>
  `;

  cartRoot.querySelectorAll(".cart-item").forEach((row) => {
    const id = Number(row.dataset.id);
    const item = cart.find((c) => c.id === id);

    row.querySelector("[data-plus]").addEventListener("click", () => {
      setQty(id, item.qty + 1);
      renderCartPage();
    });
    row.querySelector("[data-minus]").addEventListener("click", () => {
      if (item.qty <= 1) {
        removeFromCart(id);
      } else {
        setQty(id, item.qty - 1);
      }
      renderCartPage();
    });
    row.querySelector("[data-remove]").addEventListener("click", () => {
      removeFromCart(id);
      showToast(`${item.title} removed`);
      renderCartPage();
    });
  });

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      showToast("Payment simulated — thank you! 🎉");
      saveCart([]);
      setTimeout(renderCartPage, 900);
    });
  }
}

/* ============================================================
   ROUTER — decides which view to show based on location.hash
   ============================================================ */
function router() {
  const hash = window.location.hash || "#/";

  const productMatch = hash.match(/^#\/product\/(\d+)/);
  if (productMatch) {
    showView("product");
    loadProduct(productMatch[1]);
    return;
  }

  if (hash.startsWith("#/cart")) {
    showView("cart");
    renderCartPage();
    return;
  }

  showView("listing");
  loadListing();
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  router();
});