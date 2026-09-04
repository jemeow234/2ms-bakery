---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Order item

## One sentence

An order item is the persisted line-item snapshot derived from a CartItem and stored in `order_items`.

## Why this shape

The route stores product id plus product name and price so an order retains sale-time display and pricing data instead of depending only on the mutable current Product.

## Shape

- The client input is a CartItem embedding Product and quantity (`lib/types.ts:13-16`).
- Creation maps it to `order_id`, `product_id`, `product_name`, `quantity`, and `price` (`app/api/orders/route.ts:36-47`).
- User and admin order reads join the same five persisted fields (`app/api/orders/route.ts:99-109`, `app/api/admin/orders/route.ts:24-36`).
- There is no named TypeScript `OrderItem`; `Order.items` is typed as `CartItem[]` (`lib/types.ts:31-34`).

## Connected to

- Owned by Order.
- References Product id but snapshots name and price.
- Drives quantity used in Product stock decrement and Inventory log creation.

## If you change this

**Hits:** Cart-to-order mapping, order APIs, order query joins, stock-decrement inputs, order/admin display, reports, and any future database migration.

**Does not hit:** Current Product name or price automatically; the persisted snapshot is separate.

## Surfaces

Written by order creation and read through joined order queries. No standalone order-item route exists.

## See

`app/api/orders/route.ts:36-49`.
