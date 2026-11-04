# 2M's Bakery

2M's Bakery is a Next.js storefront for a bakery in Lipa City, Batangas. Customers can browse the live catalog, create an account, add products to a cart, place pick-up or delivery orders, upload GCash/InstaPay payment proof, track and cancel eligible orders, leave feedback, and maintain their profile. Staff use the protected admin area to manage products, stock, orders, walk-in sales, announcements, reports, feedback, users, and order alerts.

## Stack

- Next.js 16.4.3 App Router with React 19 and TypeScript
- Supabase Auth, Postgres, Row Level Security, Storage, Realtime, and database functions
- Tailwind CSS 4, Radix UI primitives, and Lucide icons
- Zod 4 for request validation
- Optional Cloudflare Turnstile CAPTCHA for authentication
- Resend for optional contact messages, customer receipts, and new-order alerts
- OpenStreetMap Nominatim for delivery-address geocoding
- Vercel Analytics in production

## Quick start

### Prerequisites

- Node.js 20.9 or newer (the version required by the installed Next.js release)
- npm
- A Supabase project for the application data and authentication

### Install and configure

```bash
npm install
cp .env.example .env.local
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Fill in `.env.local` before using authenticated features or delivery checkout. The important values are:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser/server Supabase client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for orders/admin APIs | Server-only key used for transactional order and admin operations |
| `NEXT_PUBLIC_SITE_URL` | Yes in deployment | Public URL used by metadata, redirects, sitemap, and receipts |
| `NEXT_PUBLIC_BAKERY_LAT` / `NEXT_PUBLIC_BAKERY_LNG` | Yes for delivery | Bakery origin used for the delivery-radius check |
| `NEXT_PUBLIC_BAKERY_ADDRESS` | Optional | Display address; a Lipa address is used when omitted |
| `RESEND_API_KEY` | Optional | Enables contact messages, customer receipts, and new-order alerts |
| `RECEIPT_FROM_EMAIL` | Optional | Verified sender used by Resend |
| `CONTACT_TO_EMAIL` | Optional | Inbox for contact-form messages |
| `ORDER_ALERT_EMAIL` | Optional | Separate inbox for new-order alerts; otherwise the contact inbox is used |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile site key for sign-in, registration, and password reset |
| `GEOCODER_USER_AGENT` | Optional | Identifying user agent for Nominatim |
| `GEOCODE_COUNTRY_CODES` | Optional | Comma-separated country codes for address lookup; defaults to `ph` |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit `.env.local`.

When Turnstile is enabled, configure its secret in Supabase Auth's Attack Protection settings as well as setting the public site key here. `ORDER_ALERT_EMAIL` is read by the application but is not currently included in `.env.example`.

### Apply the database migrations

The SQL migrations in [`supabase/migrations`](supabase/migrations) create the application tables, policies, storage buckets, order functions, rate limiting, Realtime publication, ingredient data, and the existing special-order tables. Link the Supabase CLI to the target project, then apply them in order:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

For local Supabase development, start the local stack first with `npx supabase start`. The database tests use the local Supabase CLI stack and Docker:

```bash
npm run test:db
```

The migrations include the initial catalog data. Admin access is controlled by the `role` column in `public.users`; create the first admin through the Supabase SQL editor or an existing trusted administration process.

### Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the TypeScript unit tests under `lib/` |
| `npm run test:db` | Run the Supabase SQL tests; requires a running local Supabase stack |

## Customer and staff workflows

The storefront currently supports:

- Product browsing with featured products, stock-aware catalog refreshes, grouped product variants, and ingredient descriptions.
- Account registration, sign-in, sign-out, password recovery, profile editing, and profile data stored with Supabase Auth.
- Optional Cloudflare Turnstile checks on sign-in, registration, and password reset.
- Cart and checkout. Pick-up has no item-count minimum; delivery requires at least two items and a ₱100 total.
- Pick-up or delivery within the configured one-kilometre radius. Delivery uses one-hour slots, and a slot remains bookable until 15 minutes before it ends.
- Cash or GCash payment. GCash checkout requires an image payment proof upload, limited to 5 MB.
- Customer order history, public order-tracking links, and cancellation of pending orders.
- Customer feedback after ordering.
- Terms of Service, Privacy Policy, and FAQ pages.

The protected `/admin` area provides:

- Dashboard and reports
- Product and catalog management
- Inventory adjustments and inventory logs
- Order review and status changes
- Walk-in point-of-sale orders
- Announcement management
- Existing special-order record review
- Customer feedback review
- Realtime alerts for new pending orders, with optional email alerts
- User and role management

The public special-order page and submission API were removed; the admin special-order screen remains for existing records. Email delivery is optional. If `RESEND_API_KEY` is unset, customer receipts and new-order alerts are skipped, while the contact form reports that messaging is unavailable.

## Routes

### Customer routes

| Route | Purpose |
| --- | --- |
| `/` | Storefront, catalog, featured products, and contact section |
| `/checkout` | Authenticated checkout |
| `/orders` | The signed-in customer's orders |
| `/orders/[id]` | One order's status and details |
| `/profile` | Profile details, saved contact information, and account actions |
| `/login` | Sign in or register |
| `/forgot-password` | Request a password reset |
| `/update-password` | Set a new password |
| `/faqs` | Frequently asked questions |
| `/privacy` | Privacy policy |
| `/terms` | Terms of Service |

### Admin routes

`/admin`, `/admin/orders`, `/admin/inventory`, `/admin/pos`, `/admin/reports`, `/admin/announcements`, `/admin/special-orders`, `/admin/feedback`, and `/admin/users` require an authenticated user with the `admin` role. The corresponding API handlers live under [`app/api`](app/api) and repeat authorization checks on the server.

## Repository layout

```text
app/                 Next.js pages, layouts, and API route handlers
components/          Shared UI, storefront sections, and admin shell/components
context/             Auth, store, and cart providers
lib/                 Domain rules, Supabase clients, email, delivery, and types
public/               Bundled product images and other static assets
supabase/migrations/ Database schema, RLS policies, functions, and catalog changes
supabase/tests/      SQL tests for orders, stock, status, receipts, and rate limits
map/                 Repository navigation map and workflow documentation
```

`proxy.ts` refreshes Supabase sessions for requests. `lib/delivery.ts`, the order schemas, and the Supabase database functions are shared validation and business-rule boundaries used by both the UI and server routes.

## Development notes

- The browser can use the publishable Supabase key; the service-role key is server-only and bypasses RLS.
- Order creation is performed by the `create_order` database function so price checks, stock checks, order rows, line items, and inventory logs are committed together.
- Customer cancellation is limited to pending orders; the database status transition restores the reserved stock.
- Admin new-order notifications use Supabase Realtime and an optional Resend email alert. Apply the Realtime migration before relying on in-panel alerts.
- Delivery address verification uses Nominatim and requires a valid identifying `User-Agent`; the application spaces and rate-limits geocoder requests.
- Product descriptions expose the ingredient data stored by the catalog migrations. Customers with allergies should review those descriptions and contact the bakery with questions.
- The public special-order intake was removed in the current application, although its database tables and admin records remain.
- Keep schema changes in a new ordered Supabase migration. Update the related map cards when a significant workflow or data boundary changes.
- Keep secrets and local configuration in `.env.local`, which is ignored by git.

## Verification before a change is shared

Run the checks relevant to the change:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run test:db` when changing migrations, database functions, RLS policies, stock handling, or rate limits.
