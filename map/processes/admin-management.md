---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Administrative management

## Input

An AuthProvider User with `role: 'admin'`, plus product, product-image, stock, order-status, announcement, or user-management actions from admin pages.

## Movement

1. AdminLayout waits for AuthProvider and redirects missing or non-admin users to `/login` (`app/admin/layout.tsx:17-33`).
2. It wraps the admin subtree in a nested StoreProvider, which loads products and announcements and, for admins, `/api/admin/orders` and `/api/admin/inventory` (`app/admin/layout.tsx:35-43`; `context/store-context.tsx:115-131`).
3. Admin APIs verify the Supabase Auth user and `users.role === 'admin'` before operating, for example users (`app/api/admin/users/route.ts:7-22`) and upload (`app/api/admin/upload/route.ts:9-24`).
4. Adding a product with an image first POSTs multipart form data to `/api/admin/upload`, which checks image type and a 5 MB limit, stores the file in the `product-images` Storage bucket, and returns its public URL (`app/admin/inventory/page.tsx:99-122`; `app/api/admin/upload/route.ts:26-55`).
5. The inventory page then calls `addProduct` with that URL or `/images/placeholder.jpg`, which POSTs to `/api/admin/products` (`app/admin/inventory/page.tsx:146-169`; `context/store-context.tsx:151-168`; `app/api/admin/products/route.ts:57-67`).
6. Product edits PATCH `/api/admin/products/[id]` (`context/store-context.tsx:133-149`; `app/api/admin/products/[id]/route.ts:4-36`).
7. Stock changes POST to `/api/admin/inventory`, which computes the new stock, updates the Product, and inserts a log; StoreProvider then reloads products and logs (`app/admin/inventory/page.tsx:200-211`; `app/api/admin/inventory/route.ts:69-114`; `context/store-context.tsx:183-199`).
8. Order status changes PUT `/api/admin/orders/[id]` and update local `adminOrders` (`app/admin/orders/page.tsx:56-57`; `context/store-context.tsx:229-241`; `app/api/admin/orders/[id]/route.ts:4-36`).
9. Announcements are created and deleted through StoreProvider and the admin announcement routes (`app/admin/announcements/page.tsx:38-58`; `context/store-context.tsx:249-282`; `app/api/admin/announcements/route.ts:37-89`).
10. The users page loads, edits, and deletes profiles directly through `/api/admin/users` and `/api/admin/users/[id]` (`app/admin/users/page.tsx:30-112`; `app/api/admin/users/route.ts:24-31`; `app/api/admin/users/[id]/route.ts:25-70`).

## Output

Changed Supabase rows, uploaded Storage objects, and updated admin StoreProvider or page state; otherwise an error toast.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md), [Product](../objects/catalog/product.md), [Order](../objects/commerce/order.md), [Inventory log](../objects/operations/inventory-log.md), and [Announcement](../objects/engagement/announcement.md).

**Produces:** Mutated Product/Order/User/Announcement rows, Inventory logs, and `product-images` Storage objects.

## Failure and mismatch notes

- Product update copies the submitted product into local state without reading the response (`context/store-context.tsx:140-142`).
- User deletion removes only the `users` profile; the Auth identity remains, and its next sign-in recreates a `role: 'user'` profile (`app/api/admin/users/[id]/route.ts:63-66`; `app/admin/users/page.tsx:61`; `context/auth-context.tsx:50-64`).
- Admin user and product PATCH routes pass the request body straight to `update`, so any column can be written by an admin caller (`app/api/admin/users/[id]/route.ts:25-32`; `app/api/admin/products/[id]/route.ts:25-32`).
- A successful upload is not removed when the following product insert fails (`app/admin/inventory/page.tsx:153-174`).
- The default image `/images/placeholder.jpg` has no file under `public/images/`; the repository has `public/placeholder.jpg` instead (`app/admin/inventory/page.tsx:152`).
- Stock `remove` floors at zero, while order-time `sale` does not (`app/api/admin/inventory/route.ts:84-85`; `app/api/orders/route.ts:58`).
- Admin stock update, product update, and log insert are separate writes with no transaction (`app/api/admin/inventory/route.ts:72-112`).
- Order status changes update only the nested admin StoreProvider's `adminOrders` (`context/store-context.tsx:237-239`).
- The announcement form sends no image although the type allows one (`app/admin/announcements/page.tsx:38-42`; `lib/types.ts:59`).
- Client route gating is not a substitute for API/database authorization; admin APIs perform server-side role checks, but deployed RLS and Storage policies remain unconfirmed.

## If you change this

**Hits:** Admin layout/pages/sidebar, StoreProvider, admin APIs, the `product-images` bucket, User/Product/Order/Inventory/Announcement objects, HTTP contracts, and authorization behavior.

**Does not hit:** Product seeding or password recovery.

## See

`app/admin/layout.tsx:9-45`, `context/store-context.tsx:133-282`, and `app/admin/inventory/page.tsx:99-221`.
