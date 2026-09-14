---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Order

## One sentence

An order records customer, fulfillment, payment, total, status, and child items, with a camelCase client shape and snake_case database representation.

## Why this shape

It is the durable transaction boundary between a cart (or an in-store POS sale) and downstream fulfillment, reporting, notifications, feedback, and stock movement.

## Shape

- Client `Order` contains items, total, customer fields, address, delivery type, status, creation time, payment method, and optional distance (`lib/types.ts:27-40`).
- Creation maps camelCase request fields to snake_case `orders` columns, sets `user_id` to null for guests, and uses the request `status` or `pending` (`app/api/orders/route.ts:10-29`).
- Order POST, user GET, and admin GET all return camelCase Orders whose items contain `{ id, name, price }` product stubs (`app/api/orders/route.ts:80-95`, `app/api/orders/route.ts:128-146`; `app/api/admin/orders/route.ts:40-58`).
- The admin UI updates status through `PUT /api/admin/orders/[id]`, which returns the raw row as `{ order }` (`context/store-context.tsx:229-235`; `app/api/admin/orders/[id]/route.ts:25-36`).
- `GET` and `PATCH /api/orders/[id]` remain implemented but have no in-repo caller (`app/api/orders/[id]/route.ts:4-75`).

## Connected to

- Optionally owned by User through `user_id`.
- Owns Order items.
- Creation changes Product stock and produces Inventory logs.
- Can receive Order feedback.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/http-api-contracts.md`, `schemas/supabase-data-model.md`, checkout, admin POS, StoreProvider, order APIs, admin dashboard/orders/reports, NotificationCenter, and feedback association.

**Does not hit:** The cart localStorage key or the product seed.

## Surfaces

Created by checkout and admin POS through `/api/orders`; read by StoreProvider (`orders`, `adminOrders`), NotificationCenter, and admin dashboard/orders/reports; status updated from the admin orders page.

## See

`app/api/orders/route.ts:4-150` and `app/api/admin/orders/route.ts:4-62`.
