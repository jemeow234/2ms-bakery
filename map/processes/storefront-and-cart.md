---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Storefront browsing and cart

## Input

Product rows loaded by StoreProvider from `/api/products`, category selection, a requested quantity, and any existing `bakery-cart` value.

## Movement

1. StoreProvider fetches `/api/products` on mount and stores `data.products`; the route returns `{ products }` from the `products` table (`context/store-context.tsx:44-57`, `context/store-context.tsx:115-119`; `app/api/products/route.ts:27-40`).
2. Product and featured sections read `products` from StoreProvider and filter by category or `featured` (`components/sections/products-section.tsx:24-28`; `components/sections/featured-section.tsx:11-13`).
3. ProductCard rejects a quantity above the embedded stock and calls `addToCart(product, quantity)` (`components/product-card.tsx:21-30`, `components/product-card.tsx:128`).
4. CartProvider merges by Product id or appends a new CartItem (`context/cart-context.tsx:39-51`).
5. Quantity updates remove non-positive values; totals are derived from embedded price and quantity (`context/cart-context.tsx:57-67`, `context/cart-context.tsx:73-77`).
6. After hydration from `bakery-cart`, every item change serializes the full cart back (`context/cart-context.tsx:22-37`).

## Output

In-memory and browser-persisted Cart state, navbar item count, total price, and checkout input.

## Consumes / produces

**Consumes:** [Product](../objects/catalog/product.md) and any saved [Cart](../objects/commerce/cart.md).

**Produces:** [Cart](../objects/commerce/cart.md).

## Failure and mismatch notes

- A failed or non-OK products request leaves `products` empty with only a console error, so sections show their empty state (`context/store-context.tsx:47-54`; `components/sections/products-section.tsx:150`).
- `initialProducts` is no longer read by the storefront; it is only seed input (`app/api/admin/migrate/route.ts:2`, `app/api/admin/migrate/route.ts:38`).
- Persisted CartItem values contain Product snapshots and are not reconciled with current stock or price on hydration (`context/cart-context.tsx:25-29`).
- Product images come from `product.image`, and cards switch to a fallback on load error (`components/product-card.tsx:47-52`).

## If you change this

**Hits:** Product, Cart, domain and storage schemas, `/api/products`, StoreProvider, ProductCard, storefront sections, navbar, and checkout inputs.

**Does not hit:** Existing Orders or Inventory logs before checkout.

## See

`context/store-context.tsx:44-57` and `context/cart-context.tsx:18-94`.
