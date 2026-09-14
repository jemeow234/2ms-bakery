---
type: schema
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# TypeScript domain types

## Scope and authority

`lib/types.ts` is the named client-domain type source for Product, CartItem, User, Order, InventoryLog, Announcement, and OrderFeedback. It does not prove database column types or API response normalization.

## Representations

| Interface | Key shape | Source |
|---|---|---|
| Product | merchandising fields, category union, image, stock, optional ingredient array | `lib/types.ts:1-11` |
| CartItem | embedded Product and quantity | `lib/types.ts:13-16` |
| User | profile fields and `user`/`admin` role | `lib/types.ts:18-25` |
| Order | CartItem array, customer/fulfillment/payment/status fields | `lib/types.ts:27-40` |
| InventoryLog | `add`/`remove`/`sale`/`adjustment` movement and before/after stock | `lib/types.ts:42-52` |
| Announcement | message/ad content and creator | `lib/types.ts:54-62` |
| OrderFeedback | order/user association, rating, comment | `lib/types.ts:64-71` |

## Boundaries and mismatches

- Order, InventoryLog, and public Announcement responses are mapped to camelCase in their routes (`app/api/orders/route.ts:128-146`; `app/api/admin/inventory/route.ts:31-41`; `app/api/announcements/route.ts:31-39`); products, users, feedback, and single-order routes return rows directly (`app/api/products/route.ts:37`; `app/api/admin/users/route.ts:31`; `app/api/feedback/route.ts:23`).
- API order items contain `product: { id, name, price }`, not a full Product, although `Order.items` is typed `CartItem[]` (`lib/types.ts:29`; `app/api/orders/route.ts:130-133`).
- After API mapping, `Announcement.createdBy` holds a display name rather than a user id (`app/api/announcements/route.ts:38`).
- No password-bearing user type exists; credentials are handled only by Supabase Auth.
- The admin users page types API rows as `User`, although the route also returns `created_at` (`app/admin/users/page.tsx:16`; `app/api/admin/users/route.ts:26`).
- `next.config.mjs` ignores TypeScript build errors, so a production build does not establish that these boundaries type-check (`next.config.mjs:3-5`).

## If you change this

**Hits:** All object cards, contexts, pages consuming the changed interface, API request construction, and route-level camelCase mapping.

**Does not hit:** Deployed database constraints automatically; those require database changes.

## See

`lib/types.ts:1-71`.
