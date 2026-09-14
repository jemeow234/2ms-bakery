---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Inventory log

## One sentence

An inventory log records one stock movement for a Product, including before/after stock, movement type, quantity, note, and time.

## Why this shape

The log is the audit trail accompanying mutable Product stock, allowing administrative and reporting surfaces to explain a change.

## Shape

- Client `InventoryLog` defines product identity/name, type `add | remove | sale | adjustment`, quantity, previous/new stock, optional note, and creation time (`lib/types.ts:42-52`).
- Order creation writes a `sale` log with note `Order #<id>` after updating Product stock (`app/api/orders/route.ts:57-76`).
- Admin `POST /api/admin/inventory` computes new stock for `add`, `remove` (floored at zero), or `adjustment` (exact value), updates the Product, and inserts a log (`app/api/admin/inventory/route.ts:69-112`).
- Admin `GET /api/admin/inventory` returns `{ logs }` mapped to camelCase (`app/api/admin/inventory/route.ts:24-43`).
- StoreProvider loads logs for admins and reloads them after a stock update (`context/store-context.tsx:88-99`, `context/store-context.tsx:122-131`, `context/store-context.tsx:195-198`).

## Connected to

- Owned by Product through `product_id`.
- Produced by Order creation and by admin stock changes.
- Displayed alongside stock in inventory, dashboard, and report surfaces.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/supabase-data-model.md`, checkout/order stock processing, admin inventory API, StoreProvider stock mutation, and admin inventory/dashboard/reports.

**Does not hit:** Order status transitions unless code explicitly couples them.

## Surfaces

Written by `POST /api/orders` and `POST /api/admin/inventory`. Read through the admin StoreProvider by the inventory page (`app/admin/inventory/page.tsx:547-551`), dashboard (`app/admin/page.tsx:183-198`), and reports (`app/admin/reports/page.tsx:460-474`).

## See

`app/api/admin/inventory/route.ts:4-118` and `app/api/orders/route.ts:50-78`.
