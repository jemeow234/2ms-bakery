---
type: schema
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# HTTP API contracts

## Scope and authority

Next.js route modules under `app/api/` define the implemented HTTP methods, authentication checks, request mapping, and response shapes. Consumer assumptions live in StoreProvider, the admin users page, the admin inventory page, and the migration helper.

## Representations

| Route module | Methods | Access and response | In-repo caller |
|---|---|---|---|
| `/api/products` | GET, POST | GET public `{ products }`; POST authenticated, selects all rows and returns `{ products }` without inserting (`app/api/products/route.ts:4-40`) | GET: StoreProvider. POST: none (leftover) |
| `/api/orders` | GET, POST | GET authenticated, user-scoped `{ orders }` camelCase; POST auth optional, `{ order }` camelCase (`app/api/orders/route.ts:4-150`) | StoreProvider |
| `/api/orders/[id]` | GET, PATCH | GET user-scoped raw row; PATCH admin raw row (`app/api/orders/[id]/route.ts:4-75`) | none (leftover) |
| `/api/announcements` | GET | public `{ announcements }` camelCase with creator names (`app/api/announcements/route.ts:4-46`) | StoreProvider |
| `/api/feedback` | GET, POST | authenticated; raw array / raw row (`app/api/feedback/route.ts:4-50`) | POST: StoreProvider. GET: none |
| `/api/users/profile` | GET, POST | authenticated; raw profile row (`app/api/users/profile/route.ts:4-51`) | none (leftover) |
| `/api/admin/products` | GET, POST | admin; GET raw array; POST `{ product }` raw row (`app/api/admin/products/route.ts:4-71`) | POST: StoreProvider. GET: none |
| `/api/admin/products/[id]` | PATCH, DELETE | admin; raw row / `{ success }` (`app/api/admin/products/[id]/route.ts:4-74`) | StoreProvider |
| `/api/admin/orders` | GET | admin; `{ orders }` camelCase (`app/api/admin/orders/route.ts:4-62`) | StoreProvider |
| `/api/admin/orders/[id]` | PUT | admin; `{ order }` raw row (`app/api/admin/orders/[id]/route.ts:4-40`) | StoreProvider |
| `/api/admin/inventory` | GET, POST | admin; GET `{ logs }` camelCase; POST `{ product }` raw row (`app/api/admin/inventory/route.ts:4-118`) | StoreProvider |
| `/api/admin/announcements` | GET, POST | admin; GET `{ announcements }` raw rows; POST `{ announcement }` camelCase (`app/api/admin/announcements/route.ts:4-89`) | POST: StoreProvider. GET: none |
| `/api/admin/announcements/[id]` | DELETE | admin; `{ success }` (`app/api/admin/announcements/[id]/route.ts:4-36`) | StoreProvider |
| `/api/admin/users` | GET | admin; `{ users }` with selected columns (`app/api/admin/users/route.ts:4-35`) | admin users page |
| `/api/admin/users/[id]` | PATCH, DELETE | admin; `{ user }` raw row / `{ success }` (`app/api/admin/users/[id]/route.ts:4-74`) | admin users page |
| `/api/admin/upload` | POST | admin; multipart `file`, image type, 5 MB max; `{ url }` public Storage URL (`app/api/admin/upload/route.ts:6-59`) | admin inventory page |
| `/api/admin/migrate` | POST | admin; product seed result (`app/api/admin/migrate/route.ts:5-72`) | `lib/supabase/migrate.ts:17-21` |

## Boundaries and mismatches

- StoreProvider expects `data.feedback` from feedback POST, but the route returns the raw row (`context/store-context.tsx:291-293`; `app/api/feedback/route.ts:23`).
- List routes for orders, inventory logs, and public announcements normalize to camelCase, while update/create envelopes for products, admin orders, and users wrap raw snake_case rows (`app/api/admin/products/route.ts:67`; `app/api/admin/orders/[id]/route.ts:36`; `app/api/admin/users/[id]/route.ts:36`).
- StoreProvider inserts the raw admin-product row directly into `products`, and the users page replaces a list entry with the raw `{ user }` row (`context/store-context.tsx:159-160`; `app/admin/users/page.tsx:103-104`).
- `POST /api/orders` does not require authentication and accepts client-supplied `status`, `total`, and item prices (`app/api/orders/route.ts:7-40`).
- `POST /api/products` authenticates but does not create a product (`app/api/products/route.ts:13-21`).
- Admin users and admin products PATCH forward the full request body to `update` (`app/api/admin/users/[id]/route.ts:25-29`; `app/api/admin/products/[id]/route.ts:25-29`).
- Feedback POST forwards camelCase `orderId`/`userId` from the client body while adding snake_case `user_id` (`components/feedback-modal.tsx:29-34`; `app/api/feedback/route.ts:13-17`).
- Two order-status routes exist: live `PUT /api/admin/orders/[id]` and leftover `PATCH /api/orders/[id]`.

## If you change this

**Hits:** StoreProvider, the admin users and inventory pages, checkout and POS callers, object serialization, auth/role checks, process success/error semantics, and external consumers if any exist.

**Does not hit:** The `initialProducts` seed, except through `/api/admin/migrate`.

## See

Consumers: `context/store-context.tsx:44-298`, `app/admin/users/page.tsx:30-112`, and `app/admin/inventory/page.tsx:99-122`. Implementations: `app/api/`.
