---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Order item

## One sentence

An order item is the persisted line-item snapshot derived from a CartItem and stored in `order_items`.

## Why this shape

The route stores product id plus product name and price so an order retains sale-time display and pricing data instead of depending only on the mutable current Product.

## Shape

- The client input is a CartItem embedding Product and quantity (`lib/types.ts:13-16`).
- Creation maps it to `order_id`, `product_id`, `product_name`, `quantity`, and `price` (`app/api/orders/route.ts:34-46`).
- User and admin order reads join those fields and map them back to `{ product: { id, name, price }, quantity }` (`app/api/orders/route.ts:113-133`; `app/api/admin/orders/route.ts:26-45`).
- There is no named TypeScript `OrderItem`; `Order.items` is typed as `CartItem[]` (`lib/types.ts:27-29`).

## Connected to

- Owned by Order.
- References Product id but snapshots name and price.
- Drives quantity used in Product stock decrement and Inventory log creation.

## If you change this

**Hits:** Cart-to-order mapping, order APIs, order query joins and camelCase mapping, stock-decrement inputs, order/admin display, reports, and any future database migration.

**Does not hit:** Current Product name or price automatically; the persisted snapshot is separate.

## Surfaces

Written by order creation from checkout and admin POS, and read through joined order queries. No standalone order-item route exists.

## See

`app/api/orders/route.ts:34-46`.
