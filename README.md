# STUB — Product Marketplace (HTML, CSS, JS)

A single-page e-commerce app built with **plain HTML, CSS, and JavaScript** — no frameworks, no build tools. Routing between pages is done with the URL hash, and the cart persists using `localStorage`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Single HTML shell containing all 3 views (Listing, Product, Cart) |
| `style.css` | All styling — layout, ticket-stub card design, receipt-style bill |
| `script.js` | All logic — routing, API calls, cart, rendering for every view |

## How to run

Just open `index.html` in any browser. No server, no install needed.
> Keep all 3 files in the same folder — they reference each other by relative path.

## Tasks completed

**Task 1 — Listing Page**
Fetches all products from `https://dummyjson.com/products?limit=194` and renders them as ticket-style cards (image, title, description, price). Includes search, category filter, and sort (price / rating).

**Task 2 — Product Page**
Clicking a card navigates to `#/product/:id`, which fetches that single product from `https://dummyjson.com/products/{id}` and shows full details — image gallery, rating, stock, brand, quantity selector, Pay and Add to Cart buttons.

**Task 3 — Cart Page**
`#/cart` reads cart items from `localStorage`, lets you change quantity or remove items, and shows a full **Bill Summary** — Subtotal, Shipping, Tax (8%), and Total — with a Pay button to simulate checkout.

## Routes (hash-based, no page reload)

| Route | View |
|---|---|
| `#/` | Product listing |
| `#/product/123` | Product detail for id `123` |
| `#/cart` | Cart + bill summary |

## Currency

The dummyjson API returns prices in **USD**. They are converted to **INR** right after fetching using a fixed rate:

```js
const USD_TO_INR = 83; // change this in script.js to update the rate
```

All downstream calculations (cart subtotal, tax, shipping, total) work on the already-converted INR values, so the bill stays consistent.

## Cart logic (`script.js`)

- `getCart()` / `saveCart()` — read/write cart array to `localStorage`
- `addToCart(product, qty)` — adds item or increments quantity if it already exists
- `removeFromCart(id)`, `setQty(id, qty)` — update cart
- `cartCount()`, `cartSubtotal()` — used for the header badge and bill
- Cart badge in the header updates automatically on every change

## Design notes

- Dark theme with a "ticket stub" motif — notched card edges, dashed tear-lines, receipt-style bill on the cart page
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (prices/labels)
- Images fade in with a shimmer placeholder while loading, with `preconnect` hints to the dummyjson API/CDN for faster image loads

## APIs used

- `GET https://dummyjson.com/products?limit=194` — product listing
- `GET https://dummyjson.com/products/{id}` — single product detail

## Notes

- Checkout on the cart page is **simulated** — no real payment gateway is integrated.
- This is a frontend-only project; no backend or database is used.
