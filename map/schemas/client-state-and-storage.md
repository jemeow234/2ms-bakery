---
type: schema
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Client state and browser storage

## Scope and authority

Client providers own in-memory application state; selected values and flags are stored in browser localStorage, while Supabase SSR manages authentication cookies.

## Representations

- Root provider order is AuthProvider → StoreProvider → CartProvider (`app/layout.tsx:42-49`). StoreProvider can therefore consume Auth; Cart does not consume Store.
- AdminLayout adds another StoreProvider inside the root provider, creating a separate store-state instance for admin descendants (`app/admin/layout.tsx:35-43`).
- AuthProvider exposes current User, login/register/logout, loading, and refresh (`context/auth-context.tsx:24-31`, `context/auth-context.tsx:236-240`).
- StoreProvider owns products, orders, adminOrders, inventoryLogs, announcements, feedbacks, loading, mutations, and refreshers (`context/store-context.tsx:7-29`, `context/store-context.tsx:300-328`). It loads products and announcements on mount, and orders (plus admin orders and logs for admins) when the user changes (`context/store-context.tsx:115-131`).
- CartProvider persists full CartItem values to `bakery-cart` (`context/cart-context.tsx:22-37`).
- NotificationCenter persists the newest seen announcement time to `bakery-last-seen-announcement-at` (`components/notification-center.tsx:14`, `components/notification-center.tsx:23-47`).
- Auth bootstrap checks and writes `bakery-migration-done`; the migration helper writes `bakery-migration-complete` (`context/auth-context.tsx:98-102`; `lib/supabase/migrate.ts:31`).
- Middleware refreshes Supabase SSR cookies (`lib/supabase/proxy.ts:13-27`).

## Boundaries and mismatches

- The two migration keys do not match, so the AuthProvider guard is not satisfied by the helper's own completion write.
- Admin mutations update only the nested admin StoreProvider; the root instance refetches products and announcements only on mount (`context/store-context.tsx:115-119`).
- NotificationCenter treats every non-completed order whose `customerEmail` matches the User as unread, with no persisted read state for orders (`components/notification-center.tsx:32-33`).
- A Product captured in `bakery-cart` can become stale relative to `products` rows.
- No source reads or writes `bakery-registered-users` any longer.

## If you change this

**Hits:** Root/admin layouts, provider consumers, hydration behavior, login/session UX, storefront cart, checkout, the navbar notification badge, and migration repetition.

**Does not hit:** Database RLS or column constraints automatically.

## See

`app/layout.tsx:34-54`, `context/auth-context.tsx:74-240`, `context/store-context.tsx:33-328`, `context/cart-context.tsx:18-94`, and `components/notification-center.tsx:14-48`.
