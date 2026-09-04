---
type: schema
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# Supabase data model — code-inferred

## Scope and authority

This is a verified inventory of table and column names referenced by source code. It is not an authoritative database schema: the repository contains no Supabase migration SQL or declarative schema, so constraints, indexes, defaults, triggers, RLS, and deployed column types cannot be confirmed.

## Representations

| Referenced table | Code-inferred fields/relations | Evidence |
|---|---|---|
| `users` | id, email, name, phone, address, password, role | `context/auth-context.tsx:196-207`; `app/api/users/profile/route.ts:13-24` |
| `products` | id plus Product-like fields; stock mutable; ingredients seeded as text | `app/api/admin/products/route.ts:24-31`; `app/api/admin/migrate/route.ts:38-47` |
| `orders` | user_id, customer fields, address, delivery_type, distance, total, payment_method, status, created_at | `app/api/orders/route.ts:16-32`; `app/api/orders/route.ts:97-111` |
| `order_items` | order_id, product_id, product_name, quantity, price | `app/api/orders/route.ts:36-47` |
| `inventory_logs` | product_id/name, type, quantity, previous_stock, new_stock, note, created_at | `app/api/orders/route.ts:67-78`; `app/api/admin/inventory/route.ts:24-31` |
| `announcements` | body fields plus created_by and created_at | `app/api/admin/announcements/route.ts:57-67`; `app/api/announcements/route.ts:7-17` |
| `order_feedback` | spread client body plus authenticated user_id; GET orders by created_at | `components/feedback-modal.tsx:24-34`; `app/api/feedback/route.ts:13-23`; `app/api/feedback/route.ts:38-46` |

Code-level relations are User → Orders, Order → Order items, Product → Order items/Inventory logs, User → Feedback, and User → Announcements. The client payload semantically associates Feedback with Order through `orderId`, but the route does not normalize that name. None of these observations confirms deployed foreign-key constraints.

## Boundaries and mismatches

- Client models are camelCase; queried rows are returned without a normalization layer.
- Product `ingredients` is `string[]` in TypeScript but seeded as one comma-separated string (`lib/types.ts:10`, `app/api/admin/migrate/route.ts:46`).
- The login compatibility path queries `users.password`, and registration writes the submitted value (`context/auth-context.tsx:119-125`, `context/auth-context.tsx:196-207`).
- Archived claims that all tables have RLS are unconfirmed by repository evidence (`map/_archive/prior-integration-notes/SUPABASE_INTEGRATION_COMPLETE.md:7-10`).

## If you change this

**Hits:** Matching object cards, all affected API routes, auth/profile hydration, contexts expecting row shapes, administrative views, seeding, and deployment database configuration.

**Does not hit:** Browser-local cart storage unless Product/Cart serialization changes.

## See

Primary write paths: `context/auth-context.tsx:119-207` and `app/api/orders/route.ts:13-80`.
