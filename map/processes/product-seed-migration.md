---
type: process
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Product seed migration

## Input

An authenticated browser session, an admin `users` profile, the `initialProducts` catalog, and migration flags in localStorage.

## Movement

1. The client helper retrieves the current Auth user and POSTs that id to `/api/admin/migrate` (`lib/supabase/migrate.ts:3-21`).
2. The route ignores the submitted id, resolves the current server Auth user, and verifies `users.role === 'admin'` (`app/api/admin/migrate/route.ts:5-24`).
3. It checks whether any Product row exists (`app/api/admin/migrate/route.ts:28-34`).
4. Only when the table is empty, it maps `initialProducts` into insert rows and converts ingredient arrays to comma-separated text (`app/api/admin/migrate/route.ts:34-47`).
5. It returns a success result; the client helper writes `bakery-migration-complete` (`app/api/admin/migrate/route.ts:59-64`; `lib/supabase/migrate.ts:27-33`).

## Output

At most one bulk seed of Products into an otherwise empty table, plus a browser-local completion flag.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md) authorization and [Product](../objects/catalog/product.md) seed data.

**Produces:** Product rows and `bakery-migration-complete`.

## Failure and mismatch notes

- Despite the helper name and archived documentation, no users, orders, announcements, feedback, or general localStorage data are migrated by this endpoint (`app/api/admin/migrate/route.ts:28-57`).
- AuthProvider checks and writes `bakery-migration-done`, not the helper's `bakery-migration-complete` (`context/auth-context.tsx:62-68`; `lib/supabase/migrate.ts:30-31`).
- Non-admin users trigger the helper during session hydration but receive Forbidden from the endpoint; AuthProvider then still writes its own done flag (`context/auth-context.tsx:62-68`; `app/api/admin/migrate/route.ts:15-24`).
- Ingredient representation changes from `string[]` to comma-separated text during seed.

## If you change this

**Hits:** Product, User authorization, client-state/storage and Supabase schemas, session bootstrap, `initialProducts`, and deployed seed behavior.

**Does not hit:** Existing non-product records; they are not read or written by this implementation.

## See

`lib/supabase/migrate.ts:3-38` and `app/api/admin/migrate/route.ts:5-71`.
