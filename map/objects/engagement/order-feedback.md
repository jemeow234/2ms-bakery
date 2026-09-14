---
type: object
status: verified
universe: live
verified: 2026-09-14
revision: main@6106902a6e119efb2618c157ca3d9e10d6b82bd3
---

# Order feedback

## One sentence

Order feedback is an authenticated user's rating and comment associated with an Order.

## Why this shape

It separates post-order evaluation from the transaction while retaining both order and user association.

## Shape

- `OrderFeedback` contains id, order id, user id, numeric rating, comment, and creation time (`lib/types.ts:64-71`).
- Checkout opens FeedbackModal after a successful order and passes `user?.id || 'guest'` as `userId` (`app/checkout/page.tsx:206-211`).
- FeedbackModal sends camelCase `orderId` and `userId` with rating/comment and does not await the result (`components/feedback-modal.tsx:24-42`).
- POST requires an Auth user, spreads the body, adds snake_case `user_id`, inserts into `order_feedback`, and returns the raw row (`app/api/feedback/route.ts:4-23`).
- GET filters by the authenticated `user_id` and returns raw rows; it has no in-repo caller (`app/api/feedback/route.ts:29-46`).
- StoreProvider expects `data.feedback` from POST, which the raw response does not contain (`context/store-context.tsx:291-293`).

## Connected to

- Owned by User.
- Refers to Order through the client `orderId`; the route does not normalize it to `order_id`, and the deployed database column/FK cannot be confirmed from this repository.

## If you change this

**Hits:** `schemas/domain-types.md`, `schemas/http-api-contracts.md`, `schemas/supabase-data-model.md`, feedback API, StoreProvider, checkout FeedbackModal (including the guest path), and any future feedback reader.

**Does not hit:** Order creation, Product stock, or Cart persistence.

## Surfaces

Written from checkout FeedbackModal through StoreProvider. No in-repo surface reads StoreProvider `feedbacks` or calls the feedback GET route.

## See

`app/api/feedback/route.ts:4-50`.
