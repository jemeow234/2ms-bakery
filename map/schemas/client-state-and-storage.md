---
type: schema
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Client state and browser storage

## Scope and authority

Client providers own in-memory application state; selected values and flags are stored in browser localStorage, while Supabase SSR manages authentication cookies.

## Representations

- Root provider order is AuthProvider → StoreProvider → CartProvider (`app/layout.tsx:43-50`). StoreProvider can therefore consume Auth; Cart does not consume Store.
- AdminLayout adds another StoreProvider inside the root provider, creating a separate store-state instance for admin descendants (`app/admin/layout.tsx:35-43`).
- AuthProvider exposes current User, login/register/logout, loading, and refresh (`context/auth-context.tsx:16-23`, `context/auth-context.tsx:265-268`).
- StoreProvider owns products, orders, inventory logs, announcements, feedback, and API mutations (`context/store-context.tsx:7-26`, `context/store-context.tsx:240-265`).
- CartProvider persists full CartItem values to `bakery-cart` (`context/cart-context.tsx:18-34`).
- The admin users page persists a separate collection to `bakery-registered-users` (`app/admin/users/page.tsx:36-47`, `app/admin/users/page.tsx:61-98`).
- Auth bootstrap checks `bakery-migration-done`; the migration helper writes `bakery-migration-complete` (`context/auth-context.tsx:62-68`; `lib/supabase/migrate.ts:27-33`).

## Boundaries and mismatches

- The two migration keys do not match, so the AuthProvider guard is not satisfied by the helper's own completion write; AuthProvider separately writes its key after the helper returns.
- StoreProvider accepts successful HTTP status as the gate before applying response values, but several expected wrapper properties do not exist; see `http-api-contracts.md`.
- A Product captured in `bakery-cart` can become stale relative to both Supabase and `initialProducts`.
- Admin-local user changes do not update the API-backed `users` table.

## If you change this

**Hits:** Root/admin layouts, provider consumers, hydration behavior, login/session UX, storefront cart, checkout, admin user management, and migration repetition.

**Does not hit:** Database RLS or column constraints automatically.

## See

`app/layout.tsx:35-55`, `context/auth-context.tsx:27-111`, `context/store-context.tsx:30-265`, and `context/cart-context.tsx:18-89`.
