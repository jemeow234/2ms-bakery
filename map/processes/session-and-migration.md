---
type: process
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Session bootstrap and migration trigger

## Input

An application request plus any Supabase auth cookies and browser-local migration flags.

## Movement

1. Middleware runs the Supabase proxy for non-static requests (`middleware.ts:4-12`).
2. The proxy creates a server client, calls `auth.getSession()`, and returns any updated cookies (`lib/supabase/proxy.ts:4-29`).
3. The root renders AuthProvider outside StoreProvider and CartProvider (`app/layout.tsx:35-50`).
4. AuthProvider creates the browser Supabase client and asks for the current Auth user (`context/auth-context.tsx:27-43`).
5. When an Auth user exists, it fetches the matching `users` profile and projects it into client User state (`context/auth-context.tsx:44-60`).
6. If `bakery-migration-done` is absent, AuthProvider calls the migration helper and then writes that flag (`context/auth-context.tsx:62-68`).
7. AuthProvider subscribes to auth changes and reloads/clears User state (`context/auth-context.tsx:80-110`).

## Output

Refreshed session cookies, `user | null` client state, loading completion, and possibly a triggered product-seed request.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md), runtime environment variables, cookies, and migration flags.

**Produces:** User session state; may trigger [Product](../objects/catalog/product.md) seeding through `product-seed-migration.md`.

## Failure and mismatch notes

- The browser client returns null when Supabase variables are missing, yielding unauthenticated state (`lib/supabase/client.ts:16-25`; `context/auth-context.tsx:35-39`).
- The trigger runs for any hydrated user, but the migration endpoint is admin-only (`context/auth-context.tsx:62-68`; `app/api/admin/migrate/route.ts:9-24`).
- AuthProvider writes `bakery-migration-done` after awaiting the helper even when the helper returns a failure result; it does not inspect that result (`context/auth-context.tsx:63-68`; `lib/supabase/migrate.ts:23-36`).

## If you change this

**Hits:** User, auth context, StoreProvider order loading, admin gating, runtime configuration, middleware, product seeding, and migration keys.

**Does not hit:** Cart hydration logic except provider render timing.

## See

`context/auth-context.tsx:27-111`.
