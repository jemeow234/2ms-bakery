---
type: object
status: verified
universe: live
verified: 2026-09-04
revision: Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2
---

# Order feedback

## One sentence

Order feedback is an authenticated user's rating and comment associated with an Order.

## Why this shape

It separates post-order evaluation from the transaction while retaining both order and user association.

## Shape

- `OrderFeedback` contains id, order id, user id, numeric rating, comment, and creation time (`lib/types.ts:68-75`).
- FeedbackModal sends camelCase `orderId` and `userId` with rating/comment (`components/feedback-modal.tsx:24-34`).
- POST spreads that body, adds the authenticated snake_case `user_id`, inserts into `order_feedback`, and returns the raw row (`app/api/feedback/route.ts:4-23`).
- GET filters feedback by the authenticated `user_id` and returns raw rows (`app/api/feedback/route.ts:29-46`).
- StoreProvider expects `data.feedback` from POST, which does not match the raw response (`context/store-context.tsx:224-235`).

## Connected to

- Owned by User.
- Refers to Order through the client `orderId`; the route does not normalize it to `order_id`, and the deployed database column/FK cannot be confirmed from this repository.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/http-api-contracts.md`, `schemas/supabase-data-model.md`, feedback API, StoreProvider, checkout feedback UI, and reports that consume feedback.

**Does not hit:** Order creation, Product stock, or Cart persistence.

## Surfaces

Written from checkout feedback through StoreProvider and read through the authenticated feedback API.

## See

`app/api/feedback/route.ts:4-49`.
