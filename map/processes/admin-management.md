---
type: process
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Administrative management

## Input

An AuthProvider User expected to have `role: 'admin'`, plus product, stock, order-status, announcement, or user-management actions from admin pages.

## Movement

1. AdminLayout waits for AuthProvider and redirects missing/non-admin client users to `/admin-login` (`app/admin/layout.tsx:14-32`).
2. It creates a nested StoreProvider for the admin subtree (`app/admin/layout.tsx:35-43`).
3. StoreProvider exposes product, stock, order-status, announcement, and feedback mutations through HTTP calls (`context/store-context.tsx:95-238`).
4. Implemented admin APIs independently verify the Supabase Auth user and query the `users.role` field before operating, for example products (`app/api/admin/products/route.ts:4-23`) and users (`app/api/admin/users/route.ts:4-22`).
5. Product and announcement APIs perform the requested database mutations and return raw rows (`app/api/admin/products/route.ts:37-67`; `app/api/admin/announcements/route.ts:37-67`).
6. The admin users page does not call the admin users APIs; it manages `bakery-registered-users` entirely in localStorage (`app/admin/users/page.tsx:36-47`, `app/admin/users/page.tsx:61-98`).

## Output

Depending on the action and contract alignment: changed Supabase rows, changed browser-local user records, updated local StoreProvider state, or an HTTP error/no-op.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md), [Product](../objects/catalog/product.md), [Order](../objects/commerce/order.md), [Inventory log](../objects/operations/inventory-log.md), and [Announcement](../objects/engagement/announcement.md).

**Produces:** Mutated Product/User/Order/Announcement state where a matching route exists; browser-local User records on the admin users page.

## Failure and mismatch notes

- Product update uses PUT in StoreProvider but PATCH in the route (`context/store-context.tsx:95-101`; `app/api/admin/products/[id]/route.ts:4`).
- Inventory update POST has no handler (`context/store-context.tsx:139-150`; `app/api/admin/inventory/route.ts:4`).
- Order status calls nonexistent `/api/admin/orders/[id]` with PUT; the implemented update is `/api/orders/[id]` PATCH (`context/store-context.tsx:178-184`; `app/api/orders/[id]/route.ts:37`).
- Product and announcement POST consumers expect wrapper properties that raw route responses do not provide (`context/store-context.tsx:110-120`, `context/store-context.tsx:195-205`).
- The nested admin StoreProvider loads `/api/orders`, which is filtered to the current user's orders, rather than the implemented `/api/admin/orders` list (`context/store-context.tsx:55-67`; `app/api/orders/route.ts:97-115`; `app/api/admin/orders/route.ts:24-40`).
- StoreProvider never loads the implemented inventory GET route, so admin/report inventory-log state remains its initial empty array (`context/store-context.tsx:30-37`, `context/store-context.tsx:82-93`).
- Client route gating is not a substitute for API/database authorization; implemented admin APIs do perform server-side role checks, but deployed RLS remains unconfirmed.

## If you change this

**Hits:** Admin layout/pages/sidebar, StoreProvider, admin APIs, User/Product/Order/Inventory/Announcement objects, HTTP contracts, and authorization behavior.

**Does not hit:** Static storefront data unless admin-managed products are made its source.

## See

`app/admin/layout.tsx:9-45` and `context/store-context.tsx:95-238`.
