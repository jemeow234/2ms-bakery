---
type: schema
status: stub
universe: live
verified: null
revision: null
---

# Runtime configuration

## Scope and authority

This card covers configuration that determines whether the Next.js/Supabase paths can initialize and how sessions cross requests. It does not record actual secret values, deployed Vercel settings, or Supabase project settings.

## Representations

- The browser client requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; it returns `null` outside the browser or when either is absent (`lib/supabase/client.ts:5-28`).
- The server client reads the same variables with non-null assertions and bridges Supabase cookies through Next headers (`lib/supabase/server.ts:4-28`).
- Middleware applies the Supabase session proxy to all routes except `_next/static`, `_next/image`, `favicon.ico`, and image extensions (`middleware.ts:1-12`).
- The proxy refreshes the session via `supabase.auth.getSession()` and propagates response cookies (`lib/supabase/proxy.ts:4-29`).
- Next configuration ignores TypeScript build errors and disables image optimization (`next.config.mjs:1-11`).
- Runtime scripts are `next dev`, `next build`, `next start`, and `eslint .`; the package declares Next 16.3.4, React 19.2.4, ESLint 9, and `eslint-config-next` (`package.json:6-9`, `package.json:50-54`, `package.json:68-69`).
- The tab icon comes from the App Router `app/favicon.ico` file convention; the root metadata sets no `icons` override (`app/layout.tsx:22-26`).
- Password recovery sends `redirectTo` as the current origin plus `/update-password` (`app/forgot-password/page.tsx:33-35`).
- Product image upload writes to the `product-images` Storage bucket and returns its public URL (`app/api/admin/upload/route.ts:45-53`).
- Delivery origin comes from `NEXT_PUBLIC_BAKERY_LAT`, `NEXT_PUBLIC_BAKERY_LNG`, and `NEXT_PUBLIC_BAKERY_ADDRESS`, each with a placeholder fallback (`lib/delivery.ts:28`).
- Geocoding calls OpenStreetMap Nominatim with an identifying `User-Agent`, a 1 req/s gate, and a 24-hour in-process cache; `GEOCODER_USER_AGENT` and `GEOCODE_COUNTRY_CODES` override the defaults (`lib/geocode.ts:55`).
- Receipt email requires `RESEND_API_KEY`; when it is absent the sender returns null and receipts are skipped rather than throwing. `RECEIPT_FROM_EMAIL` sets the sender (`lib/email/client.ts:9`).
- The package now depends on `resend` (`package.json:58`).

## Boundaries and mismatches

- Browser code handles missing Supabase variables by returning null; server code assumes they exist.
- Bakery coordinates are placeholders, so every delivery distance is wrong until they are set; the plumbing is correct, the origin is not.
- Whether the Resend key, sending domain, and Nominatim reachability hold in a deployed environment is not visible in this repository.
- Repository inspection cannot confirm the values or project identity configured in `.env.local` or Vercel.
- Supabase Auth email confirmation, email delivery, allowed redirect URLs, and the `product-images` bucket's existence and public-read policy are external project settings not present in this repository.
- Ignoring TypeScript build errors can allow runtime contract defects to ship without failing `next build`.

## If you change this

**Hits:** Auth bootstrap, every server API client, session refresh, password-recovery emails and redirects, product image upload and delivery, local/network/deployed behavior, build validation, the tab icon, and analytics gating.

**Does not hit:** Domain field definitions unless the configuration change also changes serialization or data source.

## See

`lib/supabase/client.ts:1-28`, `lib/supabase/server.ts:1-29`, `middleware.ts:1-12`, `next.config.mjs:1-11`, `app/forgot-password/page.tsx:33-35`, and `app/api/admin/upload/route.ts:45-53`.
