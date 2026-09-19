-- Delivery scheduling + receipt idempotency.
-- Run this in the Supabase SQL editor (this project has no CLI migration workflow).

alter table orders
  add column if not exists delivery_date    date,
  add column if not exists delivery_session text,
  add column if not exists receipt_sent_at  timestamptz;

alter table orders drop constraint if exists orders_delivery_session_check;
alter table orders add constraint orders_delivery_session_check
  check (delivery_session is null or delivery_session in ('morning', 'afternoon'));

-- Receipts are claimed by stamping receipt_sent_at before sending, so a
-- partial index on the unsent rows keeps that claim cheap.
create index if not exists orders_receipt_pending_idx
  on orders (id) where receipt_sent_at is null;
