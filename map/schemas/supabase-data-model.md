---
type: schema
status: stub
universe: live
verified: null
revision: null
---

# Supabase data model — code-inferred

## Scope and authority

This is an inventory of table, column, and Storage bucket names referenced by source code. It is not an authoritative database schema. One migration file now exists (`supabase/migrations/0001_delivery_sessions_and_receipts.sql`), covering only the delivery-scheduling and receipt columns; it is applied by hand in the Supabase SQL editor, so even those columns are not confirmed deployed. Every other table has no migration, declarative schema, or Storage definition, so constraints, indexes, defaults, triggers, RLS, Storage policies, and deployed column types cannot be confirmed.

## Representations

| Referenced resource | Code-inferred fields/relations | Evidence |
|---|---|---|
| `users` | id, email, name, phone, address, role, created_at | `context/auth-context.tsx:53-62`; `app/api/admin/users/route.ts:24-27` |
| `products` | id, name, description, price, category, image, featured, stock, ingredients (seeded as text), created_at | `app/api/admin/migrate/route.ts:38-47`; `app/api/admin/products/route.ts:24-27`; `app/api/admin/inventory/route.ts:72-96` |
| `orders` | id, nullable user_id, customer_name/email/phone, address, delivery_type, distance, delivery_date, delivery_session, receipt_sent_at, total, payment_method, status, created_at | `app/api/orders/route.ts:79-80`; `app/api/admin/orders/route.ts:56-57`; `supabase/migrations/0001_delivery_sessions_and_receipts.sql` |
| `order_items` | id, order_id, product_id, product_name, quantity, price | `app/api/orders/route.ts:34-46`; `app/api/orders/route.ts:115-121` |
| `inventory_logs` | id, product_id/name, type, quantity, previous_stock, new_stock, note, created_at | `app/api/orders/route.ts:66-76`; `app/api/admin/inventory/route.ts:31-41`; `app/api/admin/inventory/route.ts:100-110` |
| `announcements` | id, title, message, type, image, created_by (user id), created_at | `app/api/admin/announcements/route.ts:59-67`; `app/api/announcements/route.ts:19-39` |
| `order_feedback` | spread client body plus authenticated user_id; created_at ordering | `components/feedback-modal.tsx:29-34`; `app/api/feedback/route.ts:15-17`; `app/api/feedback/route.ts:38-42` |
| Storage bucket `product-images` | uploaded image objects named `<uuid>.<ext>`, read by public URL | `app/api/admin/upload/route.ts:41-53` |

Code-level relations are User → Orders (optional), Order → Order items, Product → Order items/Inventory logs, User → Feedback, and User → Announcements through `created_by`. The client payload semantically associates Feedback with Order through `orderId`, but the route does not normalize that name. None of these observations confirms deployed foreign-key constraints.

## Boundaries and mismatches

- Client models are camelCase; some routes map rows to camelCase and others return them directly (see `domain-types.md`).
- Product `ingredients` is `string[]` in TypeScript but seeded as one comma-separated string (`lib/types.ts:10`; `app/api/admin/migrate/route.ts:46`).
- Guest checkout requires `orders.user_id` to be nullable and unauthenticated inserts/updates on orders, order items, products, and inventory logs to be permitted; neither is visible in this repository (`app/api/orders/route.ts:12-17`).
- Profile creation relies on RLS allowing a signed-in user to insert their own `users` row (`context/auth-context.tsx:35-38`).
- Whether `product-images` exists and allows public reads is not in the repository; `getPublicUrl` does not verify it (`app/api/admin/upload/route.ts:53`).
- Archived claims that all tables have RLS are unconfirmed by repository evidence (`map/_archive/prior-integration-notes/SUPABASE_INTEGRATION_COMPLETE.md:7-10`).
- Receipt sending requires the admin session to read `order_items` and write `orders.receipt_sent_at` under RLS. If policy forbids either, receipts silently no-op rather than erroring (`lib/email/send-receipt.ts:14`).
- `delivery_session` is constrained to `morning`/`afternoon` by the migration, but the same vocabulary is duplicated in TypeScript and is not derived from the database (`lib/delivery.ts:19`).

## If you change this

**Hits:** Matching object cards, all affected API routes, auth/profile hydration, contexts expecting row shapes, administrative views, image upload, seeding, and deployment database/Storage configuration.

**Does not hit:** Browser-local cart storage unless Product/Cart serialization changes.

## See

Primary write paths: `context/auth-context.tsx:39-72`, `app/api/orders/route.ts:14-78`, `app/api/admin/inventory/route.ts:91-112`, and `app/api/admin/upload/route.ts:45-53`.
