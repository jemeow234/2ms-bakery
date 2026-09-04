---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# User

## One sentence

A user is split across a Supabase Auth identity, a `users` profile row, the client `User` interface, and a separate browser-local admin record.

## Why this shape

Supabase Auth supplies session identity while the application profile supplies bakery-specific fields and role. A compatibility path also keeps a password on the profile, and the admin user page maintains an independent localStorage collection.

## Shape

- `User` contains `id`, `email`, `name`, optional `phone` and `address`, and `role: 'user' | 'admin'` (`lib/types.ts:18-25`).
- `RegisteredUser` adds `password` (`lib/types.ts:27-29`), but the admin page declares a second local `RegisteredUser` without that field while later reading `userData.password` (`app/admin/users/page.tsx:13-20`, `app/admin/users/page.tsx:49-57`).
- Session hydration reads the Auth user, then loads the `users` row with the same id (`context/auth-context.tsx:41-60`).
- Registration creates an Auth user and inserts a profile row, including the submitted password for compatibility (`context/auth-context.tsx:182-207`).
- The admin user page reads and writes `bakery-registered-users`, independently of the API-backed `users` table (`app/admin/users/page.tsx:36-47`, `app/admin/users/page.tsx:61-98`).

## Connected to

- Owns orders through `orders.user_id` (`app/api/orders/route.ts:18-30`).
- Owns feedback through `order_feedback.user_id` (`app/api/feedback/route.ts:13-19`).
- Supplies `created_by` for announcements (`app/api/admin/announcements/route.ts:57-63`).
- Looks like but is not identical to the browser-local admin record.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/supabase-data-model.md`, `schemas/client-state-and-storage.md`, authentication and session processes, profile APIs, checkout identity, navigation, and admin user management.

**Does not hit:** Product catalog fields or cart quantity semantics.

## Surfaces

Read by `AuthProvider`, navbar, login/admin-login, checkout, StoreProvider, and admin pages. Written by registration, profile APIs, the login compatibility update, and the browser-local admin page.

## See

Primary orchestration: `context/auth-context.tsx:27-268`.
