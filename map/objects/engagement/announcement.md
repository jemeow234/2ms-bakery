---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Announcement

## One sentence

An announcement is an admin-authored message or advertisement with optional image and creation metadata.

## Why this shape

The same object supports informational notices and promotional content while retaining its author and creation time.

## Shape

- `Announcement` defines id, title, message, type, optional image, `createdAt`, and `createdBy` (`lib/types.ts:58-66`).
- Public GET returns `{ announcements: [...] }` ordered by `created_at` (`app/api/announcements/route.ts:4-17`).
- Admin POST adds `created_by` from the authenticated admin and returns the raw row (`app/api/admin/announcements/route.ts:37-67`).
- StoreProvider expects `data.announcement` from that POST, so the live client and route response shapes disagree (`context/store-context.tsx:195-205`).

## Connected to

- Authored by User.
- Loaded into StoreProvider independently of products and orders.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/http-api-contracts.md`, announcement APIs, StoreProvider, public announcement rendering, and admin announcement management.

**Does not hit:** Cart totals, Order items, or Product stock.

## Surfaces

Read by public StoreProvider consumers and admin pages. Written and deleted through admin announcement routes.

## See

`app/api/announcements/route.ts:4-20` and `app/api/admin/announcements/route.ts:37-70`.
