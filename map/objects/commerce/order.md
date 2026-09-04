---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Order

## One sentence

An order records customer, fulfillment, payment, total, status, and child items, with a camelCase client shape and snake_case database/API representation.

## Why this shape

It is the durable transaction boundary between a user's cart and downstream fulfillment, reporting, feedback, and stock movement.

## Shape

- Client `Order` contains items, total, customer fields, address, delivery type, status, creation time, payment method, and optional distance (`lib/types.ts:31-44`).
- Creation maps camelCase request fields into snake_case `orders` columns and forces initial status to `pending` (`app/api/orders/route.ts:13-32`).
- User order reads join `order_items` and return database rows directly without camelCase normalization (`app/api/orders/route.ts:97-115`).
- Status update is implemented as `PATCH /api/orders/[id]` and requires an admin profile (`app/api/orders/[id]/route.ts:37-69`).

## Connected to

- Owned by User through `user_id`.
- Owns Order items.
- Order creation changes Product stock and produces Inventory logs.
- Can receive Order feedback.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/http-api-contracts.md`, `schemas/supabase-data-model.md`, checkout, StoreProvider, order APIs, admin order pages, reports, and feedback association.

**Does not hit:** The cart localStorage key or static product catalog source by itself.

## Surfaces

Created by checkout/API, read by StoreProvider and admin order/report pages, and updated by the order detail API.

## See

`app/api/orders/route.ts:4-118`.
