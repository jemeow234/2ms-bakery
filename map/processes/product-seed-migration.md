---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Product seed migration

## Input

An authenticated browser session, an admin `users` profile, the `initialProducts` catalog, and migration flags in localStorage.

## Movement

1. AuthProvider calls the client helper when `bakery-migration-done` is absent (`context/auth-context.tsx:98-102`).
2. The client helper retrieves the current Auth user and POSTs that id to `/api/admin/migrate` (`lib/supabase/migrate.ts:3-21`).
3. The route ignores the submitted id, resolves the current server Auth user, and verifies `users.role === 'admin'` (`app/api/admin/migrate/route.ts:5-24`).
4. It checks whether any Product row exists (`app/api/admin/migrate/route.ts:28-34`).
5. Only when the table is empty, it maps `initialProducts` into insert rows and converts ingredient arrays to comma-separated text (`app/api/admin/migrate/route.ts:34-47`).
6. It returns a success result; the client helper writes `bakery-migration-complete` (`app/api/admin/migrate/route.ts:60-64`; `lib/supabase/migrate.ts:27-33`).

## Output

At most one bulk seed of Products into an otherwise empty table, plus a browser-local completion flag.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md) authorization and [Product](../objects/catalog/product.md) seed data.

**Produces:** Product rows and `bakery-migration-complete`.

## Failure and mismatch notes

- Despite the helper name and archived documentation, no users, orders, announcements, feedback, or general localStorage data are migrated by this endpoint (`app/api/admin/migrate/route.ts:28-57`).
- AuthProvider checks and writes `bakery-migration-done`, not the helper's `bakery-migration-complete` (`context/auth-context.tsx:98-102`; `lib/supabase/migrate.ts:30-31`).
- Non-admin users trigger the helper during session hydration but receive Forbidden from the endpoint; AuthProvider still writes its own done flag (`context/auth-context.tsx:98-102`; `app/api/admin/migrate/route.ts:15-24`).
- Ingredient representation changes from `string[]` to comma-separated text during seed.
- Because the storefront now reads `products` rows, this seed is the only path by which `initialProducts` reaches customers (`app/api/admin/migrate/route.ts:2`).

## If you change this

**Hits:** Product, User authorization, client-state/storage and Supabase schemas, session bootstrap, `initialProducts`, and deployed seed behavior.

**Does not hit:** Existing non-product records; they are not read or written by this implementation.

## See

`lib/supabase/migrate.ts:3-38` and `app/api/admin/migrate/route.ts:5-72`.
