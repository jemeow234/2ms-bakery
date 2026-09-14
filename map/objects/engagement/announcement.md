---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Announcement

## One sentence

An announcement is an admin-authored message or advertisement with optional image and creation metadata.

## Why this shape

The same object supports informational notices and promotional content while retaining its author and creation time.

## Shape

- `Announcement` defines id, title, message, type, optional image, `createdAt`, and `createdBy` (`lib/types.ts:54-62`).
- Public GET returns `{ announcements }` in camelCase, newest first, with `createdBy` resolved from the creator's user id to a name or `Admin` (`app/api/announcements/route.ts:8-41`).
- Admin POST inserts title, message, type, image, and `created_by`, then returns `{ announcement }` in camelCase with the poster's name (`app/api/admin/announcements/route.ts:57-85`).
- Admin GET returns raw rows but has no in-repo caller (`app/api/admin/announcements/route.ts:24-31`).
- The admin form sends title, message, and type only (`app/admin/announcements/page.tsx:38-42`).
- NotificationCenter counts announcements newer than the browser-stored `bakery-last-seen-announcement-at` (`components/notification-center.tsx:14`, `components/notification-center.tsx:34-47`).

## Connected to

- Authored by User.
- Loaded into StoreProvider independently of products and orders.
- Shown in the home AnnouncementModal once per signed-in user id and in the navbar NotificationCenter (`app/page.tsx:19-23`; `components/announcement-modal.tsx:13`).

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/http-api-contracts.md`, `schemas/client-state-and-storage.md`, announcement APIs, StoreProvider, AnnouncementModal, NotificationCenter, and admin announcement management.

**Does not hit:** Cart totals, Order items, or Product stock.

## Surfaces

Read by StoreProvider consumers: the home modal, navbar NotificationCenter, and admin announcements page. Written and deleted through admin announcement routes.

## See

`app/api/announcements/route.ts:4-46` and `app/api/admin/announcements/route.ts:37-89`.
