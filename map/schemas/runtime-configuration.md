---
type: schema
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Runtime configuration

## Scope and authority

This card covers configuration that determines whether the Next.js/Supabase paths can initialize and how sessions cross requests. It does not record actual secret values or deployed Vercel settings.

## Representations

- The browser client requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; it returns `null` when either is absent (`lib/supabase/client.ts:5-25`).
- The server client reads the same variables with non-null assertions and bridges Supabase cookies through Next headers (`lib/supabase/server.ts:4-28`).
- Middleware applies the Supabase session proxy to all non-static/image routes (`middleware.ts:1-12`).
- The proxy refreshes the session via `supabase.auth.getSession()` and propagates response cookies (`lib/supabase/proxy.ts:4-29`).
- Next configuration ignores TypeScript build errors and disables image optimization (`next.config.mjs:1-11`).
- Runtime scripts are `next dev`, `next build`, `next start`, and `eslint .`; the audited package declares Next 16.3.4 and React 19.2.4 (`package.json:5-10`, `package.json:40-54`).

## Boundaries and mismatches

- Browser code handles missing Supabase variables by returning null; server code assumes they exist.
- Repository inspection cannot confirm the values or project identity configured in `.env.local` or Vercel.
- Ignoring TypeScript build errors can allow runtime contract defects to ship without failing `next build`.

## If you change this

**Hits:** Auth bootstrap, every server API client, session refresh, local/network/deployed behavior, image delivery, build validation, and analytics gating.

**Does not hit:** Domain field definitions unless the configuration change also changes serialization or data source.

## See

`lib/supabase/client.ts:1-28`, `lib/supabase/server.ts:1-29`, `middleware.ts:1-12`, and `next.config.mjs:1-11`.
