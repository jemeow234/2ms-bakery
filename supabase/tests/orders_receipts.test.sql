-- pgTAP: the orders columns, constraints and triggers that the receipt flow
-- (lib/email/send-receipt.ts) and delivery scheduling depend on.
-- Run with: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------

select has_table('public', 'orders', 'orders table exists');
select has_column('public', 'orders', 'delivery_date', 'orders.delivery_date exists');
select has_column('public', 'orders', 'delivery_session', 'orders.delivery_session exists');
select has_column('public', 'orders', 'receipt_sent_at', 'orders.receipt_sent_at exists');
select col_type_is('public', 'orders', 'receipt_sent_at', 'timestamp with time zone',
                   'receipt_sent_at is timestamptz');
select col_is_null('public', 'orders', 'receipt_sent_at',
                   'receipt_sent_at is nullable — null means "not yet sent"');

-- The claim-then-send query filters on receipt_sent_at is null, so the partial
-- index backing it has to be there.
select has_index('public', 'orders', 'orders_receipt_pending_idx',
                 'partial index on unsent receipts exists');

select is(relrowsecurity, true, 'RLS is enabled on orders')
  from pg_class where oid = 'public.orders'::regclass;

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.orders (delivery_type, payment_method, delivery_session)
     values ('delivery', 'cash', 'midnight') $$,
  '23514',
  null,
  'delivery_session rejects a value outside morning/afternoon'
);

select lives_ok(
  $$ insert into public.orders (delivery_type, payment_method, delivery_session)
     values ('delivery', 'cash', 'morning') $$,
  'delivery_session accepts morning'
);

select lives_ok(
  $$ insert into public.orders (delivery_type, payment_method, delivery_session)
     values ('pickup', 'card', null) $$,
  'delivery_session may be null (pickup / unscheduled)'
);

-- ---------------------------------------------------------------------------
-- Receipt idempotency: the claim only ever succeeds once
-- ---------------------------------------------------------------------------

insert into public.orders (id, delivery_type, payment_method, total, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'delivery', 'cash', 250.00,
        '2020-01-01T00:00:00Z');

select is(
  (select receipt_sent_at from public.orders
    where id = '11111111-1111-1111-1111-111111111111'),
  null,
  'a new order starts with no receipt stamp'
);

with claimed as (
  update public.orders set receipt_sent_at = now()
    where id = '11111111-1111-1111-1111-111111111111'
      and receipt_sent_at is null
    returning id
)
select is(count(*), 1::bigint, 'first claim stamps the row')
  from claimed;

with claimed as (
  update public.orders set receipt_sent_at = now()
    where id = '11111111-1111-1111-1111-111111111111'
      and receipt_sent_at is null
    returning id
)
select is(count(*), 0::bigint, 'second claim matches nothing — no duplicate receipt')
  from claimed;

-- A send failure releases the claim so a retry can pick the order back up.
update public.orders set receipt_sent_at = null
 where id = '11111111-1111-1111-1111-111111111111';

with claimed as (
  update public.orders set receipt_sent_at = now()
    where id = '11111111-1111-1111-1111-111111111111'
      and receipt_sent_at is null
    returning id
)
select is(count(*), 1::bigint, 'a released claim can be retaken')
  from claimed;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

select is(
  (select updated_at from public.orders
    where id = '11111111-1111-1111-1111-111111111111'),
  now(),
  'orders_set_updated_at bumps updated_at on write'
);

select * from finish();

rollback;
