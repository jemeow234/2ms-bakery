# Change-impact catalog

Use this catalog before editing. Open the listed cards, then follow their source citations. Cards own the detailed waterfall; this file only routes.

## Domain changes

| If changing | Open first | Then inspect |
|---|---|---|
| User/profile fields, role, or credentials | `objects/identity/user.md` | `schemas/domain-types.md`, `schemas/supabase-data-model.md`, `processes/authentication-and-registration.md`, `processes/session-and-migration.md` |
| Product fields, price, category, ingredients, or stock | `objects/catalog/product.md` | `schemas/domain-types.md`, `schemas/supabase-data-model.md`, `processes/storefront-and-cart.md`, `processes/checkout-order-and-stock.md`, `processes/product-seed-migration.md` |
| Cart serialization, item shape, or totals | `objects/commerce/cart.md` | `objects/catalog/product.md`, `schemas/client-state-and-storage.md`, `processes/storefront-and-cart.md`, `processes/checkout-order-and-stock.md` |
| Order fields, status, or fulfillment/payment shape | `objects/commerce/order.md` | `objects/commerce/order-item.md`, `schemas/http-api-contracts.md`, `schemas/supabase-data-model.md`, `processes/checkout-order-and-stock.md`, `processes/admin-management.md` |
| Order-item snapshot or quantity semantics | `objects/commerce/order-item.md` | `objects/catalog/product.md`, `objects/operations/inventory-log.md`, `processes/checkout-order-and-stock.md` |
| Stock movement or inventory audit fields | `objects/operations/inventory-log.md` | `objects/catalog/product.md`, `schemas/http-api-contracts.md`, `processes/checkout-order-and-stock.md`, `processes/admin-management.md` |
| Announcement shape or publication behavior | `objects/engagement/announcement.md` | `schemas/http-api-contracts.md`, `processes/admin-management.md` |
| Feedback shape or ownership | `objects/engagement/order-feedback.md` | `objects/commerce/order.md`, `objects/identity/user.md`, `schemas/http-api-contracts.md` |

## Boundary changes

| If changing | Open first | Then inspect |
|---|---|---|
| API path, HTTP method, request body, or response envelope | `schemas/http-api-contracts.md` | `context/store-context.tsx`, relevant object card, relevant process card |
| Supabase column, relationship, constraint, or RLS policy | `schemas/supabase-data-model.md` | Every API route naming the table, relevant object/process cards, deployed database definition |
| TypeScript domain interface | `schemas/domain-types.md` | Relevant object card, contexts, pages, API serializers |
| localStorage key or persisted client shape | `schemas/client-state-and-storage.md` | `objects/commerce/cart.md` or `objects/identity/user.md`, session/storefront processes |
| Supabase URL/key, cookies, middleware matcher, Next build behavior | `schemas/runtime-configuration.md` | `processes/session-and-migration.md`, all server APIs, local/network/deployed environment |
| Provider nesting or provider ownership | `schemas/client-state-and-storage.md` | `app/layout.tsx`, `app/admin/layout.tsx`, all consumers of the moved provider |

## Source-of-truth changes

| Intended change | Open first | Required decision |
|---|---|---|
| Make storefront products database-backed | `objects/catalog/product.md` | Choose whether `initialProducts` remains seed-only or remains a live fallback; then update `processes/storefront-and-cart.md` |
| Make admin users database-backed | `objects/identity/user.md` | Replace or deliberately retain `bakery-registered-users`; then reconcile admin pages with `/api/admin/users` |
| Make API consumers consistent | `schemas/http-api-contracts.md` | Choose raw rows or named envelopes once; align StoreProvider and routes together |
| Make stock/order creation atomic | `processes/checkout-order-and-stock.md` | Requires an authoritative database transaction/RPC design not present in this repository |
| Replace compatibility password storage | `processes/authentication-and-registration.md` | Coordinate Auth identity, profile schema/data migration, login UI, and session behavior |
| Make migration repeatable | `processes/product-seed-migration.md` | Choose one flag, define eligible role, and define whether the operation is seed or migration |

## Ghost and leftover guardrails

- Do not implement against `POST /api/admin/inventory` or `/api/admin/orders/[id]` as if they exist; open `schemas/http-api-contracts.md` first.
- Do not treat `lib/supabase/queries.ts` as the live access layer without re-checking reachability; the audit found no static imports of that module.
- Do not use `_archive/prior-integration-notes/` as implementation evidence. Those files preserve prior claims and intent only.
- Do not claim deployed RLS, constraints, seed accounts, or environment values from this map; inspect the actual Supabase/Vercel project first.

## Human check

After a change, re-open the affected object and process cards. Update citations, revision, and verified date only after the source and waterfall agree.
