---
type: schema
status: verified
universe: live
verified: 2026-09-04
revision: main@54998ac6c451df883db082bf8cc72ca78f61e854
---

# TypeScript domain types

## Scope and authority

`lib/types.ts` is the named client-domain type source for Product, CartItem, User, RegisteredUser, Order, InventoryLog, Announcement, and OrderFeedback. It does not prove database column types or API response normalization.

## Representations

| Interface | Key shape | Source |
|---|---|---|
| Product | merchandising fields, category union, stock, optional ingredient array | `lib/types.ts:1-11` |
| CartItem | embedded Product and quantity | `lib/types.ts:13-16` |
| User / RegisteredUser | profile, role, optional password extension | `lib/types.ts:18-29` |
| Order | CartItem array, customer/fulfillment/payment/status fields | `lib/types.ts:31-44` |
| InventoryLog | movement type and before/after stock | `lib/types.ts:46-56` |
| Announcement | message/ad content and creator | `lib/types.ts:58-66` |
| OrderFeedback | order/user association, rating, comment | `lib/types.ts:68-75` |

## Boundaries and mismatches

- API routes generally return snake_case Supabase rows directly, while the interfaces use camelCase (`app/api/orders/route.ts:97-115`).
- There is no named TypeScript OrderItem; persisted `order_items` are represented as CartItem values inside Order.
- The admin users page declares a second `RegisteredUser` and then accesses a password field absent from that local declaration (`app/admin/users/page.tsx:13-20`, `app/admin/users/page.tsx:49-57`).
- `next.config.mjs` ignores TypeScript build errors, so a production build does not establish that these boundaries type-check (`next.config.mjs:2-8`).

## If you change this

**Hits:** All object cards, contexts, pages consuming the changed interface, API request construction, and any explicit serialization/deserialization layer.

**Does not hit:** Deployed database constraints automatically; those require database changes.

## See

`lib/types.ts:1-75`.
