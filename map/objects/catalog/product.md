---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Product

## One sentence

A product is a sellable bakery item stored as a `products` row, typed as `Product`, and seeded from the static `initialProducts` list.

## Why this shape

The object combines merchandising fields, an image, and mutable stock so the same product can be displayed, placed in a cart, snapshotted into an order item, and adjusted by orders or administrators.

## Shape

- `Product` owns identity, description, price, category, image, featured flag, stock, and optional string-array ingredients (`lib/types.ts:1-11`).
- Storefront and admin surfaces read rows through StoreProvider, which loads `{ products }` from `/api/products` (`context/store-context.tsx:44-57`; `app/api/products/route.ts:27-40`).
- `initialProducts` is a twelve-record static list used only as seed input (`lib/data.ts:3-136`; `app/api/admin/migrate/route.ts:34-47`).
- Seeding converts `ingredients` from an array to a comma-separated string (`app/api/admin/migrate/route.ts:46`).
- An admin-created product's `image` is a public Supabase Storage URL from the `product-images` bucket, or `/images/placeholder.jpg` when no file is chosen (`app/admin/inventory/page.tsx:152-168`; `app/api/admin/upload/route.ts:45-55`).
- Order reads return only `{ id, name, price }` for each item's product, not a full Product (`app/api/orders/route.ts:130-133`; `app/api/admin/orders/route.ts:42-45`).

## Connected to

- Embedded in CartItem.
- Referenced and snapshotted by Order item.
- Owns current stock; order sales and admin stock changes each produce Inventory log entries.
- Optionally owns an image object in Supabase Storage.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/supabase-data-model.md`, `/api/products`, StoreProvider, storefront sections, product cards, Cart, order-item construction, admin product/inventory/upload APIs, POS, reports, and the seed process.

**Does not hit:** User credentials or announcement content.

## Surfaces

Read by storefront sections, product cards, CartProvider, checkout, StoreProvider, admin inventory/POS/dashboard/report pages, and the order API. Written by admin product and inventory APIs, image upload, seeding, and order-time stock updates.

## See

`lib/types.ts:1-11`, `app/api/products/route.ts:27-40`, and `app/admin/inventory/page.tsx:146-221`.
