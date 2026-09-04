---
type: schema
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# HTTP API contracts

## Scope and authority

Next.js route modules under `app/api/` define the implemented HTTP methods, authentication checks, request mapping, and response shapes. Consumer assumptions are separately defined in StoreProvider.

## Representations

| Route module | Implemented methods | Access/response summary |
|---|---|---|
| `/api/products` | GET, POST | GET public; POST authenticated; raw result (`app/api/products/route.ts:4-37`) |
| `/api/orders` | GET, POST | authenticated; raw order/array (`app/api/orders/route.ts:4-115`) |
| `/api/orders/[id]` | GET, PATCH | authenticated GET; admin PATCH; raw row (`app/api/orders/[id]/route.ts:4-69`) |
| `/api/announcements` | GET | public; `{ announcements }` (`app/api/announcements/route.ts:4-17`) |
| `/api/feedback` | GET, POST | authenticated; raw row/array (`app/api/feedback/route.ts:4-46`) |
| `/api/users/profile` | GET, POST | authenticated; raw profile row (`app/api/users/profile/route.ts:4-47`) |
| `/api/admin/products` and `/[id]` | GET, POST; PATCH, DELETE | admin; raw rows except delete success (`app/api/admin/products/route.ts:4-67`; `app/api/admin/products/[id]/route.ts:4-68`) |
| `/api/admin/orders` | GET | admin; raw array (`app/api/admin/orders/route.ts:4-40`) |
| `/api/admin/inventory` | GET | admin; raw array (`app/api/admin/inventory/route.ts:4-31`) |
| `/api/admin/announcements` and `/[id]` | GET, POST; DELETE | admin; raw rows/success (`app/api/admin/announcements/route.ts:4-67`; `app/api/admin/announcements/[id]/route.ts:4-35`) |
| `/api/admin/users` and `/[id]` | GET; PATCH, DELETE | admin; raw rows/success (`app/api/admin/users/route.ts:4-31`; `app/api/admin/users/[id]/route.ts:4-72`) |
| `/api/admin/migrate` | POST | admin; product seed result (`app/api/admin/migrate/route.ts:5-70`) |

## Boundaries and mismatches

- StoreProvider reads `data.products` and `data.orders`, but those GET routes return raw arrays (`context/store-context.tsx:39-63`; `app/api/products/route.ts:37`; `app/api/orders/route.ts:115`).
- StoreProvider expects `data.product`, `data.order`, `data.announcement`, and `data.feedback` from POSTs; the corresponding routes return raw rows (`context/store-context.tsx:110-120`, `context/store-context.tsx:159-170`, `context/store-context.tsx:195-205`, `context/store-context.tsx:224-234`).
- StoreProvider sends `PUT /api/admin/products/[id]`; the route implements PATCH (`context/store-context.tsx:95-101`; `app/api/admin/products/[id]/route.ts:4`).
- StoreProvider sends `POST /api/admin/inventory`; only GET exists (`context/store-context.tsx:139-150`; `app/api/admin/inventory/route.ts:4`).
- StoreProvider sends `PUT /api/admin/orders/[id]`; that route module does not exist. The implemented update is `PATCH /api/orders/[id]` (`context/store-context.tsx:178-184`; `app/api/orders/[id]/route.ts:37`).
- `POST /api/products` checks authentication but does not perform the admin-role check used by `/api/admin/products` (`app/api/products/route.ts:4-21`; `app/api/admin/products/route.ts:37-56`).
- Feedback POST forwards camelCase `orderId`/`userId` from the client body while also adding snake_case `user_id`; no request normalization is implemented (`components/feedback-modal.tsx:24-34`; `app/api/feedback/route.ts:13-19`).

## If you change this

**Hits:** StoreProvider, callers in checkout/admin pages, object serialization, auth/role checks, process success/error semantics, and external consumers if any exist.

**Does not hit:** Static storefront reads from `initialProducts` unless those components are migrated to the API.

## See

Consumer contract: `context/store-context.tsx:39-238`. Implementations: `app/api/`.
