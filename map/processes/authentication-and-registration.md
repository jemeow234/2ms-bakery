---
type: process
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Authentication and registration

## Input

Login email/password, or registration name, email, phone, address, password, and confirmation, entered at `/login`. Customers and admins share this page; no separate admin login page exists.

## Movement

1. The login page switches local `authMode` between login and register (`app/login/page.tsx:15-18`, `app/login/page.tsx:124-150`).
2. Login calls AuthProvider `login`, which calls Supabase Auth `signInWithPassword` (`app/login/page.tsx:39-43`; `context/auth-context.tsx:128-138`).
3. After sign-in, `loadUserProfile` reads the `users` row for the Auth id, creating a `role: 'user'` row from Auth metadata when none exists (`context/auth-context.tsx:39-72`, `context/auth-context.tsx:144-147`).
4. Login sets User state and returns the profile role; the page redirects admins to `/admin` and everyone else to `/` (`context/auth-context.tsx:149-150`; `app/login/page.tsx:45-47`).
5. Registration UI checks password confirmation and a six-character minimum, then calls `register` (`app/login/page.tsx:55-77`).
6. `register` calls Auth `signUp` with name, phone, and address as user metadata (`context/auth-context.tsx:162-173`).
7. An Auth user with no identities is reported as an existing account; a result without a session returns `needsEmailConfirmation` and defers profile creation to the first real sign-in (`context/auth-context.tsx:183-193`).
8. With a session, `register` loads or creates the profile from the submitted fields and sets User state; the page redirects home or asks the user to confirm by email (`context/auth-context.tsx:195-206`; `app/login/page.tsx:79-86`).

## Output

An AuthProvider User plus Supabase Auth session, a pending-confirmation result, or a structured `{ success: false, error }` result displayed by the UI.

## Consumes / produces

**Consumes:** [User](../objects/identity/user.md) credentials/profile input and runtime Supabase configuration.

**Produces:** Supabase Auth identity and session, a `users` profile row on first session, and client User state.

## Failure and mismatch notes

- The login redirect trusts the returned role, but the client gate is AdminLayout, which sends non-admins back to `/login` (`app/login/page.tsx:47`; `app/admin/layout.tsx:17-21`).
- Profile creation is a client-side insert that, per the source comment, must satisfy RLS with a live session; deployed RLS is not in this repository (`context/auth-context.tsx:35-38`, `context/auth-context.tsx:53-69`).
- If the profile cannot be loaded or created, login returns an error after Auth sign-in has already succeeded; the auth-change listener repeats the same profile load (`context/auth-context.tsx:144-147`, `context/auth-context.tsx:114-118`).
- Whether `signUp` yields an immediate session depends on the Supabase email-confirmation setting, which cannot be confirmed from source.
- Forgotten passwords use a separate movement: `password-recovery.md`.

## If you change this

**Hits:** User, domain/data schemas, login page, AdminLayout gating, session bootstrap, profile creation, the password-recovery entry link, and migration triggering.

**Does not hit:** Product catalog rendering or cart quantity calculations.

## See

`context/auth-context.tsx:39-211` and `app/login/page.tsx:39-92`.
