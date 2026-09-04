---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Inventory log

## One sentence

An inventory log records one stock movement for a Product, including before/after stock, movement type, quantity, note, and time.

## Why this shape

The log is the audit trail accompanying mutable Product stock, allowing administrative and reporting surfaces to explain a change.

## Shape

- Client `InventoryLog` defines product identity/name, type, quantity, previous/new stock, optional note, and creation time (`lib/types.ts:46-56`).
- Order creation writes snake_case values with type `sale` after updating Product stock (`app/api/orders/route.ts:51-78`).
- The admin inventory API implements authenticated admin `GET` and returns raw `inventory_logs` rows (`app/api/admin/inventory/route.ts:4-31`).
- StoreProvider calls `POST /api/admin/inventory`, but no POST handler exists in that route module (`context/store-context.tsx:139-156`, `app/api/admin/inventory/route.ts:4`). This call edge is ghost.
- StoreProvider declares `inventoryLogs` state but has no loader for the implemented GET route (`context/store-context.tsx:7-26`, `context/store-context.tsx:30-37`).

## Connected to

- Owned by Product through `product_id`.
- May be produced by Order creation.
- Displayed alongside stock in inventory, dashboard, and report surfaces.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/supabase-data-model.md`, checkout/order stock processing, inventory API, StoreProvider stock mutation, admin inventory/dashboard, and reports.

**Does not hit:** Order status transitions unless code explicitly couples them.

## Surfaces

Written by the order API in the audited live path. The admin inventory API can read rows, while administrative/reporting pages consume StoreProvider's currently unpopulated `inventoryLogs` state.

## See

`app/api/orders/route.ts:51-78` and `app/api/admin/inventory/route.ts:4-33`.
