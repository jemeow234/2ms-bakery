---
type: process
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Authentication and registration

## Input

Login email/password or registration name, email, phone, address, password, and confirmation entered at `/login`; admin login supplies email/password to the same AuthProvider login function.

## Movement

1. The login page switches local `authMode` between login and register and submits to the corresponding AuthProvider function (`app/login/page.tsx:14-35`, `app/login/page.tsx:127-142`).
2. Registration UI checks password confirmation and a six-character minimum, then passes profile fields and password to `register` (`app/login/page.tsx:58-75`).
3. Login queries the `users` table for an exact email/password match (`context/auth-context.tsx:113-125`).
4. For a matching compatibility user, it calls Supabase Auth `signUp` with a random password, may replace the profile id with the Auth id, and sets client User state (`context/auth-context.tsx:127-155`).
5. Registration first checks profile-email uniqueness, calls Auth `signUp` with the submitted password, then inserts a `users` profile including that same password (`context/auth-context.tsx:165-207`).
6. Successful registration sets User state; customer login redirects home, while admin login redirects to `/admin` and the admin layout subsequently checks the role (`context/auth-context.tsx:213-223`; `app/(auth)/admin-login/page.tsx:22-36`; `app/admin/layout.tsx:17-32`).

## Output

Either an AuthProvider User plus possible Supabase Auth session, or a structured `{ success: false, error }` result displayed by the UI.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md) credentials/profile input and runtime Supabase configuration.

**Produces:** Supabase Auth identity, `users` profile row, and client User state.

## Failure and mismatch notes

- The login implementation does not call `signInWithPassword`; its live path is profile-table password comparison followed by `signUp` with a random password (`context/auth-context.tsx:119-155`).
- Submitted registration passwords are written to the `users` profile for compatibility (`context/auth-context.tsx:196-207`).
- Admin login redirects on any successful login result; role enforcement occurs later in AdminLayout (`app/(auth)/admin-login/page.tsx:26-32`; `app/admin/layout.tsx:17-32`).
- Whether `signUp` immediately yields an authenticated session depends on external Supabase project settings, which are not present in this repository and cannot be confirmed.

## If you change this

**Hits:** User, domain/data schemas, login and admin-login pages, session bootstrap, profile ownership, admin authorization, and migration triggering.

**Does not hit:** Product catalog rendering or cart quantity calculations.

## See

`context/auth-context.tsx:113-228` and `app/login/page.tsx:14-80`.
