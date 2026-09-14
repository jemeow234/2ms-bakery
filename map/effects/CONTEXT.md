# Change-impact catalog

Use this catalog before editing. Open the listed cards, then follow their source citations. Cards own the detailed waterfall; this file only routes.

## Domain changes

| If changing | Open first | Then inspect |
|---|---|---|
| User/profile fields, role, or credentials | `objects/identity/user.md` | `schemas/domain-types.md`, `schemas/supabase-data-model.md`, `processes/authentication-and-registration.md`, `processes/password-recovery.md`, `processes/session-and-migration.md`, `processes/admin-management.md` |
| Product fields, price, category, ingredients, image, or stock | `objects/catalog/product.md` | `schemas/domain-types.md`, `schemas/supabase-data-model.md`, `processes/storefront-and-cart.md`, `processes/checkout-order-and-stock.md`, `processes/admin-management.md`, `processes/product-seed-migration.md` |
| Cart serialization, item shape, or totals | `objects/commerce/cart.md` | `objects/catalog/product.md`, `schemas/client-state-and-storage.md`, `processes/storefront-and-cart.md`, `processes/checkout-order-and-stock.md` |
| Order fields, status, guest ownership, or fulfillment/payment shape | `objects/commerce/order.md` | `objects/commerce/order-item.md`, `schemas/http-api-contracts.md`, `schemas/supabase-data-model.md`, `processes/checkout-order-and-stock.md`, `processes/admin-management.md` |
| Order-item snapshot or quantity semantics | `objects/commerce/order-item.md` | `objects/catalog/product.md`, `objects/operations/inventory-log.md`, `processes/checkout-order-and-stock.md` |
| Stock movement or inventory audit fields | `objects/operations/inventory-log.md` | `objects/catalog/product.md`, `schemas/http-api-contracts.md`, `processes/checkout-order-and-stock.md`, `processes/admin-management.md` |
| Announcement shape, publication, or unseen-badge behavior | `objects/engagement/announcement.md` | `schemas/http-api-contracts.md`, `schemas/client-state-and-storage.md`, `processes/admin-management.md` |
| Feedback shape or ownership | `objects/engagement/order-feedback.md` | `objects/commerce/order.md`, `objects/identity/user.md`, `schemas/http-api-contracts.md`, `processes/checkout-order-and-stock.md` |

## Boundary changes

| If changing | Open first | Then inspect |
|---|---|---|
| API path, HTTP method, request body, or response envelope | `schemas/http-api-contracts.md` | `context/store-context.tsx`, `app/admin/users/page.tsx`, `app/admin/inventory/page.tsx`, relevant object and process cards |
| Supabase column, relationship, constraint, or RLS policy | `schemas/supabase-data-model.md` | Every API route naming the table, relevant object/process cards, deployed database definition |
| Product image upload, file limits, or Storage bucket | `processes/admin-management.md` | `schemas/runtime-configuration.md`, `schemas/supabase-data-model.md`, `objects/catalog/product.md`, deployed Storage policy |
| Password-reset request, redirect, or recovery-session handling | `processes/password-recovery.md` | `schemas/runtime-configuration.md`, `processes/authentication-and-registration.md`, deployed Supabase Auth URL/email settings |
| TypeScript domain interface | `schemas/domain-types.md` | Relevant object card, contexts, pages, route camelCase mappers |
| localStorage key or persisted client shape | `schemas/client-state-and-storage.md` | `objects/commerce/cart.md` or `objects/engagement/announcement.md`, session/storefront processes |
| Supabase URL/key, cookies, middleware matcher, Next build behavior, or static app icons | `schemas/runtime-configuration.md` | `processes/session-and-migration.md`, all server APIs, local/network/deployed environment |
| Provider nesting or provider ownership | `schemas/client-state-and-storage.md` | `app/layout.tsx`, `app/admin/layout.tsx`, all consumers of the moved provider |

## Source-of-truth changes

| Intended change | Open first | Required decision |
|---|---|---|
| Retire or replace the static product seed | `processes/product-seed-migration.md` | `initialProducts` is seed-only; choose whether to keep it, then align the migration flags |
| Fully delete a user | `processes/admin-management.md` | Admin delete removes only the `users` profile; decide whether to also remove the Auth identity, which otherwise recreates a profile on next sign-in |
| Make API consumers consistent | `schemas/http-api-contracts.md` | Choose camelCase or raw rows per envelope once; fix feedback POST and raw update envelopes together with StoreProvider |
| Make stock/order creation atomic or server-priced | `processes/checkout-order-and-stock.md` | Requires an authoritative database transaction/RPC and server-side price/status rules not present in this repository |
| Require sign-in for checkout or feedback | `processes/checkout-order-and-stock.md` | Guests can order but cannot submit feedback; choose one policy across the route, checkout UI, and deployed RLS |
| Make migration repeatable | `processes/product-seed-migration.md` | Choose one flag, define eligible role, and define whether the operation is seed or migration |

## Ghost and leftover guardrails

- Treat `GET`/`PATCH /api/orders/[id]`, `POST /api/products`, `GET /api/admin/products`, `GET /api/admin/announcements`, `GET /api/feedback`, and `/api/users/profile` as leftover: implemented but with no in-repo caller. `POST /api/products` does not create products. Open `schemas/http-api-contracts.md` first.
- Do not treat `lib/supabase/queries.ts` as the live access layer without re-checking reachability; the audit found no static imports of that module.
- Do not use `_archive/prior-integration-notes/` as implementation evidence. Those files preserve prior claims and intent only.
- Do not claim deployed RLS, Storage policies, constraints, seed accounts, Auth URL settings, or environment values from this map; inspect the actual Supabase/Vercel project first.

## Human check

After a change, re-open the affected object and process cards. Update citations, revision, and verified date only after the source and waterfall agree.
