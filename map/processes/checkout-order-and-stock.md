---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Checkout, order creation, and stock movement

## Input

Cart items, customer/contact/fulfillment/payment form fields, an optional authenticated User, and current Product rows in Supabase. Admin POS sales enter the same order route.

## Movement

1. Checkout reads Cart, Store, and Auth contexts and pre-fills contact fields once for a signed-in user (`app/checkout/page.tsx:50-52`, `app/checkout/page.tsx:74-83`).
2. It enforces the minimum quantity and, for delivery, simulates distance with a random value (`app/checkout/page.tsx:99-103`, `app/checkout/page.tsx:117-130`).
3. After a simulated 1.5-second delay it awaits StoreProvider `addOrder` with an Order-shaped payload and `status: 'pending'` (`app/checkout/page.tsx:134-152`).
4. The admin POS calls the same `addOrder` with walk-in defaults, pickup, and `status: 'completed'` (`app/admin/pos/page.tsx:101-111`).
5. StoreProvider POSTs to `/api/orders` and, on success, prepends `data.order` to `orders` and, for admins, `adminOrders` (`context/store-context.tsx:207-221`).
6. The route reads the optional Auth user and inserts an `orders` row with `user_id` null for guests and `status || 'pending'` (`app/api/orders/route.ts:7-29`).
7. It inserts mapped `order_items` (`app/api/orders/route.ts:34-46`).
8. For each item it reads stock, writes `stock - quantity`, and inserts a `sale` Inventory log (`app/api/orders/route.ts:50-78`).
9. It returns `{ order }` in camelCase with the request items (`app/api/orders/route.ts:80-95`).
10. Checkout stores the order, clears the Cart, shows the order number, and opens FeedbackModal (`app/checkout/page.tsx:154-165`).

## Output

An Order with Order items, reduced Product stock, Inventory logs, an emptied Cart, and checkout success state.

## Consumes / produces

**Consumes:** optional [User](../objects/identity/user.md), [Cart](../objects/commerce/cart.md), and [Product](../objects/catalog/product.md).

**Produces:** [Order](../objects/commerce/order.md), [Order item](../objects/commerce/order-item.md), and [Inventory log](../objects/operations/inventory-log.md); mutates Product stock.

## Failure and mismatch notes

- Guests can place orders: the route no longer requires authentication, and checkout sign-in is optional (`app/api/orders/route.ts:12-17`; `app/checkout/page.tsx:397-404`).
- The route accepts client-supplied `status`, `total`, and item prices instead of deriving them from Product rows (`app/api/orders/route.ts:10`, `app/api/orders/route.ts:26`, `app/api/orders/route.ts:34-40`).
- Order, order-item, stock, and inventory-log writes are separate operations with no transaction, and stock/log write errors are not checked (`app/api/orders/route.ts:14-78`).
- No non-negative stock validation is performed before `newStock` is written (`app/api/orders/route.ts:57-63`).
- Delivery distance is random, not derived from the address (`app/checkout/page.tsx:99`).
- A guest's FeedbackModal passes `userId: 'guest'`, but feedback POST requires authentication (`app/checkout/page.tsx:210`; `app/api/feedback/route.ts:9-11`).
- TypeScript build errors are ignored in Next configuration (`next.config.mjs:3-5`).

## If you change this

**Hits:** Cart, Order, Order item, Product, Inventory log, checkout UI, admin POS, StoreProvider, HTTP/data schemas, admin order/inventory pages, reports, and NotificationCenter.

**Does not hit:** Announcement creation or password recovery.

## See

`app/checkout/page.tsx:114-171`, `context/store-context.tsx:207-227`, and `app/api/orders/route.ts:4-99`.
