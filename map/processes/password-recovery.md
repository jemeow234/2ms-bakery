---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Password recovery

## Input

A visitor's email address entered at `/forgot-password`, reached from the login page's "Forgot Password?" link (`app/login/page.tsx:194-201`), followed by the Supabase recovery link delivered by email.

## Movement

1. The forgot-password page creates the browser Supabase client and stops with an error toast when it is unavailable (`app/forgot-password/page.tsx:22-28`).
2. It calls `auth.resetPasswordForEmail` with `redirectTo` set to the current origin plus `/update-password` (`app/forgot-password/page.tsx:33-35`).
3. It shows the same "check your email" confirmation regardless of the call's result (`app/forgot-password/page.tsx:30-38`, `app/forgot-password/page.tsx:69-76`).
4. On `/update-password`, the page subscribes to auth changes and marks the link ready on a `PASSWORD_RECOVERY` event or any session; it also checks for an existing session (`app/update-password/page.tsx:40-50`).
5. If neither arrives within three seconds, the page marks the link invalid and offers a new request (`app/update-password/page.tsx:53-55`, `app/update-password/page.tsx:138-151`).
6. Submission requires at least six characters and a matching confirmation, then calls `auth.updateUser({ password })` (`app/update-password/page.tsx:67-86`).
7. On success it shows confirmation and redirects to `/login` after two seconds; on failure it displays the Supabase error (`app/update-password/page.tsx:90-100`).

## Output

An updated Supabase Auth password for the recovering identity, or an invalid-link or error state. No `users` profile row is written.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md) Auth identity (email) and runtime Supabase configuration.

**Produces:** A changed Supabase Auth credential; no application object is created.

## Failure and mismatch notes

- Request errors are never shown, by design, so rate limits or email misconfiguration are invisible to the visitor (`app/forgot-password/page.tsx:30-35`).
- The ready check accepts any session, not only a recovery session, so an already signed-in user who opens `/update-password` can set a new password without a recovery link (`app/update-password/page.tsx:41`, `app/update-password/page.tsx:46-50`).
- Whether the email is sent and whether Supabase accepts the `/update-password` redirect depends on the project's email and redirect-URL settings, which are not in this repository.
- Middleware refreshes the Supabase session on these routes like any other non-static request (`middleware.ts:1-12`).

## If you change this

**Hits:** User Auth identity, the login page link, forgot/update-password pages, AuthProvider auth-change listener, `schemas/runtime-configuration.md`, and deployed Supabase Auth URL/email settings.

**Does not hit:** The `users` profile row, Orders, Cart, or StoreProvider state.

## See

`app/forgot-password/page.tsx:13-39` and `app/update-password/page.tsx:17-101`.
