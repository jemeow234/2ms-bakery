---
type: process
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Checkout, order creation, and stock movement

## Input

Authenticated User, Cart items, customer/contact/fulfillment/payment form fields, and the current Product rows in Supabase.

## Movement

1. Checkout reads Cart, Store, and Auth contexts (`app/checkout/page.tsx:50-52`).
2. It enforces minimum quantity and simulates delivery distance with a random value before submission (`app/checkout/page.tsx:91-112`, `app/checkout/page.tsx:114-130`).
3. It constructs an Order-shaped payload and calls StoreProvider `addOrder` (`app/checkout/page.tsx:132-152`).
4. StoreProvider POSTs the payload to `/api/orders` (`context/store-context.tsx:159-165`).
5. The route verifies a Supabase user, inserts an `orders` row, then inserts mapped `order_items` (`app/api/orders/route.ts:4-49`).
6. For each item, the route reads current stock, calculates `stock - quantity`, updates the Product, and inserts an Inventory log (`app/api/orders/route.ts:51-80`).
7. The route returns the raw order row (`app/api/orders/route.ts:82`).

## Output

Intended output is an Order with Order items, reduced Product stock, Inventory logs, an emptied Cart, and checkout success state.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md), [Cart](../objects/commerce/cart.md), and [Product](../objects/catalog/product.md).

**Produces:** [Order](../objects/commerce/order.md), [Order item](../objects/commerce/order-item.md), and [Inventory log](../objects/operations/inventory-log.md); mutates Product stock.

## Failure and mismatch notes

- Checkout does not await `addOrder`; it immediately accesses `order.id` even though `addOrder` returns a Promise (`app/checkout/page.tsx:138-155`; `context/store-context.tsx:18`).
- StoreProvider expects `{ order }`, but the API returns the raw order row, so its `data.order` value is absent under the implemented contract (`context/store-context.tsx:166-170`; `app/api/orders/route.ts:82`).
- Order, order-item, stock, and inventory-log writes are separate operations with no transaction in the route; a later failure can leave earlier writes committed (`app/api/orders/route.ts:16-80`).
- No non-negative stock validation is performed before `newStock` is written (`app/api/orders/route.ts:51-65`).
- TypeScript build errors are ignored in Next configuration (`next.config.mjs:2-5`).

## If you change this

**Hits:** Cart, Order, Order item, Product, Inventory log, checkout UI, StoreProvider, HTTP/data schemas, admin order/inventory pages, and reports.

**Does not hit:** Announcement creation or authentication credential comparison.

## See

`app/checkout/page.tsx:114-164`, `context/store-context.tsx:159-176`, and `app/api/orders/route.ts:4-84`.
