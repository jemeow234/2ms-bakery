---
type: process
status: stub
universe: live
verified: null
revision: null
---

# Checkout, order creation, and stock movement

## Input

Cart items, customer/contact/fulfillment/payment form fields, an optional authenticated User, and current Product rows in Supabase. Admin POS sales enter the same order route.

## Movement

1. Checkout reads Cart, Store, and Auth contexts and pre-fills contact fields once for a signed-in user (`app/checkout/page.tsx:50-52`, `app/checkout/page.tsx:74-83`).
2. The customer picks a delivery/pick-up date and one of two fixed sessions; unavailable sessions are disabled by lead time (`app/checkout/page.tsx:520`; `lib/delivery.ts:19`, `lib/delivery.ts:85`).
3. For delivery, the typed address is geocoded server-side and turned into a real distance; the quote is invalidated on every address edit so a stale distance cannot be submitted (`app/checkout/page.tsx:102`, `app/checkout/page.tsx:634`).
4. Checkout blocks submission until quantity, schedule, and an in-range quote all hold (`app/checkout/page.tsx:143`).
5. On submit it re-uses the returned quote object rather than reading it back from state, then awaits StoreProvider `addOrder` with `status: 'pending'` (`app/checkout/page.tsx:167`, `app/checkout/page.tsx:200`).
6. The admin POS calls the same `addOrder` with walk-in defaults, pickup, and `status: 'completed'` (`app/admin/pos/page.tsx:101-111`).
7. StoreProvider POSTs to `/api/orders` and, on success, prepends `data.order` to `orders` and, for admins, `adminOrders` (`context/store-context.tsx:207-221`).
8. The route rejects a missing or expired schedule for non-walk-in orders (`app/api/orders/route.ts:30`).
9. For delivery it re-derives distance from the address and rejects out-of-range or ungeocodable addresses, ignoring any client-supplied distance (`app/api/orders/route.ts:43`).
10. It reads the optional Auth user and inserts an `orders` row with `user_id` null for guests, the server distance, and the schedule columns (`app/api/orders/route.ts:79-80`).
11. It inserts mapped `order_items`, then per item reads stock, writes `stock - quantity`, and inserts a `sale` Inventory log.
12. If the new order is already `completed` (POS), it schedules a receipt email after the response (`app/api/orders/route.ts:140`).
13. It returns `{ order }` in camelCase with the request items and schedule fields (`app/api/orders/route.ts:157-158`).
14. Checkout stores the order, clears the Cart, shows the order number and booked slot, and opens FeedbackModal.
15. When an admin later sets an order to `completed`, that route schedules the same receipt email (`app/api/admin/orders/[id]/route.ts:40`).

## Output

An Order carrying a booked delivery session and a server-derived distance, with Order items, reduced Product stock, Inventory logs, an emptied Cart, checkout success state, and — once completed — one emailed receipt.

## Consumes / produces

**Consumes:** optional [User](../objects/identity/user.md), [Cart](../objects/commerce/cart.md), and [Product](../objects/catalog/product.md).

**Produces:** [Order](../objects/commerce/order.md), [Order item](../objects/commerce/order-item.md), and [Inventory log](../objects/operations/inventory-log.md); mutates Product stock.

## Failure and mismatch notes

- Guests can place orders: the route no longer requires authentication, and checkout sign-in is optional (`app/api/orders/route.ts:12-17`; `app/checkout/page.tsx:397-404`).
- The route still accepts client-supplied `status`, `total`, and item prices instead of deriving them from Product rows. Because a walk-in is recognised by `status === 'completed'`, a crafted request can still skip the schedule requirement — though not the delivery-radius check, which runs for every delivery order (`app/api/orders/route.ts:29`, `app/api/orders/route.ts:41`).
- Order, order-item, stock, and inventory-log writes are separate operations with no transaction, and stock/log write errors are not checked.
- No non-negative stock validation is performed before `newStock` is written.
- Distance now comes from OpenStreetMap Nominatim, an external service with no SLA and a 1 req/s cap; a lookup failure surfaces as an explicit error rather than an allowed order (`lib/geocode.ts:55`).
- Bakery origin coordinates are placeholders until `NEXT_PUBLIC_BAKERY_LAT`/`LNG` are set, so absolute distances are not yet trustworthy (`lib/delivery.ts:28`).
- Session lead-time maths uses a fixed UTC+8 offset rather than a timezone database (`lib/delivery.ts:72`).
- Receipt sending depends on `RESEND_API_KEY` and on RLS permitting the admin session to write `orders.receipt_sent_at`; neither is verified in this repository (`lib/email/send-receipt.ts:14`).
- A guest's FeedbackModal passes `userId: 'guest'`, but feedback POST requires authentication (`app/checkout/page.tsx:210`; `app/api/feedback/route.ts:9-11`).
- TypeScript build errors are ignored in Next configuration (`next.config.mjs:3-5`).

## If you change this

**Hits:** Cart, Order, Order item, Product, Inventory log, checkout UI, admin POS, StoreProvider, HTTP/data schemas, admin order/inventory pages, reports, and NotificationCenter.

**Does not hit:** Announcement creation or password recovery.

## See

`app/checkout/page.tsx:102`, `context/store-context.tsx:207-227`, `app/api/orders/route.ts:7`, `lib/delivery.ts:1`, `lib/geocode.ts:97`, and `lib/email/send-receipt.ts:14`.
