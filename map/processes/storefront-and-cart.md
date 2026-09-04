---
type: process
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Storefront browsing and cart

## Input

The hard-coded Product catalog, category selection, a requested quantity, and any existing `bakery-cart` value.

## Movement

1. Product and featured sections select items directly from `initialProducts` (`components/sections/products-section.tsx:5-24`; `components/sections/featured-section.tsx:5-12`).
2. ProductCard constrains quantity using the embedded Product stock and calls `addToCart(product, quantity)` (`components/product-card.tsx:17-33`, `components/product-card.tsx:107-127`).
3. CartProvider merges by Product id or appends a new CartItem (`context/cart-context.tsx:36-47`).
4. Quantity updates remove non-positive values; totals are derived from embedded price and quantity (`context/cart-context.tsx:50-74`).
5. After initial hydration, every item change serializes the full cart to `bakery-cart` (`context/cart-context.tsx:22-34`).

## Output

In-memory and browser-persisted Cart state, navbar item count, total price, and checkout input.

## Consumes / produces

**Consumes:** [Product](../objects/catalog/product.md) and any saved [Cart](../objects/commerce/cart.md).

**Produces:** [Cart](../objects/commerce/cart.md).

## Failure and mismatch notes

- The visible storefront uses static `initialProducts`, while StoreProvider separately fetches API products; these are independent live sources (`components/sections/products-section.tsx:23-24`; `context/store-context.tsx:39-53`).
- Persisted CartItem values contain Product snapshots and are not reconciled with current stock or price on hydration (`context/cart-context.tsx:22-26`).

## If you change this

**Hits:** Product, Cart, domain and storage schemas, ProductCard, storefront sections, navbar, and checkout inputs.

**Does not hit:** Existing Orders or Inventory logs before checkout.

## See

`context/cart-context.tsx:18-89`.
