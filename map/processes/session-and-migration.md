---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Session bootstrap and migration trigger

## Input

An application request plus any Supabase auth cookies and browser-local migration flags.

## Movement

1. Middleware runs the Supabase proxy for requests outside `_next/static`, `_next/image`, `favicon.ico`, and image extensions (`middleware.ts:4-12`).
2. The proxy creates a server client, calls `auth.getSession()`, and returns any updated cookies (`lib/supabase/proxy.ts:4-29`).
3. The root renders AuthProvider outside StoreProvider and CartProvider (`app/layout.tsx:42-49`).
4. AuthProvider creates the browser Supabase client; when it is null, loading ends unauthenticated (`context/auth-context.tsx:75`, `context/auth-context.tsx:83-87`).
5. Initialization reads the current session and, for a session user, loads or creates the `users` profile and sets User state (`context/auth-context.tsx:89-97`).
6. If `bakery-migration-done` is absent, AuthProvider awaits the migration helper and then writes that flag (`context/auth-context.tsx:98-102`).
7. AuthProvider subscribes to auth changes and reloads or clears User state (`context/auth-context.tsx:114-121`).

## Output

Refreshed session cookies, `user | null` client state, loading completion, and possibly a triggered product-seed request.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md), runtime environment variables, cookies, and migration flags.

**Produces:** User session state and possibly a new `users` profile row; may trigger [Product](../objects/catalog/product.md) seeding through `product-seed-migration.md`.

## Failure and mismatch notes

- The browser client returns null outside the browser or when Supabase variables are missing, yielding unauthenticated state (`lib/supabase/client.ts:7-20`; `context/auth-context.tsx:83-87`).
- The client bootstrap uses `getSession` (`context/auth-context.tsx:91`), while API routes verify the caller with `auth.getUser()` (for example `app/api/admin/users/route.ts:7`).
- A failed profile insert sets User state to null even though an Auth session exists (`context/auth-context.tsx:66-69`, `context/auth-context.tsx:116-117`).
- The migration trigger runs for any hydrated user, but the migration endpoint is admin-only (`context/auth-context.tsx:98-102`; `app/api/admin/migrate/route.ts:9-24`).
- AuthProvider writes `bakery-migration-done` after awaiting the helper even when the helper returns a failure result (`context/auth-context.tsx:100-101`; `lib/supabase/migrate.ts:23-36`).

## If you change this

**Hits:** User, auth context, StoreProvider order loading, admin gating, runtime configuration, middleware, product seeding, and migration keys.

**Does not hit:** Cart hydration logic except provider render timing.

## See

`context/auth-context.tsx:74-126`.
