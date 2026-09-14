---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Cart

## One sentence

The cart is a browser-local list of `CartItem` values, where each item embeds a full Product plus a quantity.

## Why this shape

Embedding Product lets UI totals and checkout payloads run without another lookup, but it also persists a snapshot of mutable product fields in localStorage.

## Shape

- `CartItem` is `{ product: Product, quantity: number }` (`lib/types.ts:13-16`).
- CartProvider hydrates from `bakery-cart` in an effect and writes the full item array back after load (`context/cart-context.tsx:22-37`).
- Adding by product id merges quantity; zero or negative quantity removes the item (`context/cart-context.tsx:39-67`).
- Totals derive from embedded product prices (`context/cart-context.tsx:73-77`).

## Connected to

- Owns embedded Product snapshots.
- Supplies items to checkout and becomes Order items.
- Is independent of StoreProvider persistence until checkout calls `addOrder`.

## If you change this

**Hits:** Product serialization, `schemas/client-state-and-storage.md`, product-card actions, navbar counts, checkout totals and payload construction, and order item mapping.

**Does not hit:** Existing persisted orders or inventory logs until the checkout process runs.

## Surfaces

Read and written by CartProvider, product cards, navbar, and checkout. Persisted only in browser localStorage by the audited source.

## See

`context/cart-context.tsx:6-102`.
