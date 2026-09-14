---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# User

## One sentence

A user is a Supabase Auth identity paired with a `users` profile row and projected into the client `User` interface.

## Why this shape

Supabase Auth owns credentials and sessions, while the profile row supplies bakery-specific fields and the `role` used for admin gating. The profile is created lazily on the first session because a signup that requires email confirmation has no session with which to insert it (`context/auth-context.tsx:35-38`).

## Shape

- `User` contains `id`, `email`, `name`, optional `phone` and `address`, and `role: 'user' | 'admin'` (`lib/types.ts:18-25`).
- `loadUserProfile` reads the `users` row by Auth id; when absent it inserts `id`, `email`, `name`, `phone`, `address`, and `role: 'user'` from submitted fields or Auth metadata (`context/auth-context.tsx:39-72`).
- Registration stores name, phone, and address as Auth user metadata; no password is written to the profile (`context/auth-context.tsx:162-173`).
- Credentials live only in Supabase Auth: sign-in uses `signInWithPassword`, and recovery uses `resetPasswordForEmail` then `updateUser` (`context/auth-context.tsx:134`; `app/forgot-password/page.tsx:33-35`; `app/update-password/page.tsx:86`).
- The admin list selects `id, email, name, phone, address, role, created_at` (`app/api/admin/users/route.ts:24-27`).

## Connected to

- Owns orders through nullable `orders.user_id`; guest orders have no owner (`app/api/orders/route.ts:12-17`).
- Owns feedback through `order_feedback.user_id` (`app/api/feedback/route.ts:15-17`).
- Supplies `announcements.created_by`, which the public route resolves to a display name (`app/api/admin/announcements/route.ts:66`; `app/api/announcements/route.ts:19-38`).
- Looks like but is not the order's customer: NotificationCenter matches orders to the user by `customerEmail`, not `user_id` (`components/notification-center.tsx:32`).

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/supabase-data-model.md`, authentication, password-recovery, and session processes, login/AdminLayout redirects, admin users page and APIs, checkout pre-fill, NotificationCenter, and announcement creator names.

**Does not hit:** Product catalog fields or cart quantity semantics.

## Surfaces

Read by AuthProvider, navbar, login, checkout, StoreProvider, NotificationCenter, the home announcement trigger, and admin layout/pages. Written by `loadUserProfile`, admin users PATCH/DELETE, Supabase Auth flows, and `POST /api/users/profile` (implemented, no in-repo caller).

## See

`context/auth-context.tsx:39-211`.
