---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Product

## One sentence

A product is a sellable bakery item represented by `Product`, the hard-coded `initialProducts` catalog, and `products` table rows returned by APIs.

## Why this shape

The object combines merchandising fields with mutable stock so the same product can be displayed, placed in a cart, snapshotted into an order item, and adjusted by order processing.

## Shape

- `Product` owns identity, description, price, category, image, featured flag, stock, and optional string-array ingredients (`lib/types.ts:1-11`).
- `initialProducts` is a live twelve-record catalog (`lib/data.ts:3-136`).
- The storefront reads `initialProducts` directly (`components/sections/products-section.tsx:5-24`, `components/sections/featured-section.tsx:5-12`).
- StoreProvider separately requests `/api/products` (`context/store-context.tsx:39-53`), and the API returns raw `products` rows (`app/api/products/route.ts:27-37`).
- Product seeding converts `ingredients` from an array to a comma-separated string (`app/api/admin/migrate/route.ts:38-47`).

## Connected to

- Embedded in CartItem.
- Referenced and snapshotted by Order item.
- Owns current stock; stock movement produces Inventory log entries.
- Has two live read sources: hard-coded storefront data and Supabase/API state.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/supabase-data-model.md`, storefront sections, product cards, Cart, order-item construction, product APIs, admin catalog/inventory, and the seed process.

**Does not hit:** User authentication credentials or announcement content.

## Surfaces

Read by storefront sections, product cards, CartProvider, checkout, StoreProvider, admin product/inventory/POS/report pages, and order APIs. Written by admin product APIs, seeding, and order-time stock updates.

## See

Client shape: `lib/types.ts:1-11`. Live static source: `lib/data.ts:3-136`.
