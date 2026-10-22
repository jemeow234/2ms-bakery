-- pgTAP: set_order_status() (0015_order_status_and_walk_ins.sql) returns an
-- order's stock when it's cancelled — exactly once, and only what the order
-- actually took — and keeps completed and cancelled orders final.
-- Run with: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into public.products (id, name, price, stock, category)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'Test Pandesal', 2.00, 10, 'without_palaman');

-- An order placed through create_order takes 4 (10 -> 6).
create temp table placed as
select (public.create_order(
  '[{"product_id": "bbbbbbbb-0000-4000-8000-000000000001", "quantity": 4}]',
  null, 'Test', 'test@example.com', '0917', '', 'pickup', null,
  '2030-01-01', '09:00', 'cash', null, 'pending', null
) ->> 'id')::uuid as id;

select is(
  (select public.set_order_status((select id from placed), 'processing') ->> 'status'),
  'processing',
  'pending -> processing'
);
select is((select stock from public.products where id = 'bbbbbbbb-0000-4000-8000-000000000001'), 6,
          'processing leaves stock alone');

select is(
  (select public.set_order_status((select id from placed), 'cancelled') ->> 'status'),
  'cancelled',
  'processing -> cancelled'
);
select is((select stock from public.products where id = 'bbbbbbbb-0000-4000-8000-000000000001'), 10,
          'cancelling puts the 4 back');
select is(
  (select count(*)::int from public.inventory_logs
    where type = 'add' and note = 'Order #' || (select id from placed) || ' cancelled'),
  1,
  'the restock is logged'
);

select lives_ok(
  format($$ select public.set_order_status(%L, 'cancelled') $$, (select id from placed)),
  'cancelling a cancelled order again is a no-op'
);
select is((select stock from public.products where id = 'bbbbbbbb-0000-4000-8000-000000000001'), 10,
          '...and does not restock twice');

select throws_ok(
  format($$ select public.set_order_status(%L, 'pending') $$, (select id from placed)),
  'P0001', 'ORDER_CLOSED',
  'a cancelled order cannot be reopened'
);

-- An order from before 0013 whose stock was never taken: no sale logs.
insert into public.orders (id, delivery_type, payment_method, status, customer_email)
values ('cccccccc-0000-4000-8000-000000000001', 'pickup', 'cash', 'pending', 'old@example.com');
insert into public.order_items (order_id, product_id, product_name, quantity, price)
values ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
        'Test Pandesal', 3, 2.00);

select lives_ok(
  $$ select public.set_order_status('cccccccc-0000-4000-8000-000000000001', 'cancelled') $$,
  'an old order with no sale logged can be cancelled'
);
select is((select stock from public.products where id = 'bbbbbbbb-0000-4000-8000-000000000001'), 10,
          '...without inventing stock it never took');

insert into public.orders (id, delivery_type, payment_method, status, customer_email)
values ('cccccccc-0000-4000-8000-000000000002', 'pickup', 'cash', 'completed', 'done@example.com');

select throws_ok(
  $$ select public.set_order_status('cccccccc-0000-4000-8000-000000000002', 'cancelled') $$,
  'P0001', 'ORDER_CLOSED',
  'a completed order cannot be cancelled'
);

select throws_ok(
  $$ select public.set_order_status('00000000-0000-4000-8000-000000000000', 'cancelled') $$,
  'P0001', 'ORDER_NOT_FOUND',
  'an unknown order is refused'
);

select throws_ok(
  format($$ select public.set_order_status(%L, 'shipped') $$, (select id from placed)),
  'P0001', 'INVALID_STATUS',
  'an unknown status is refused'
);

select ok(
  not has_function_privilege('authenticated', 'public.set_order_status(uuid, text)', 'execute')
  and not has_function_privilege('anon', 'public.set_order_status(uuid, text)', 'execute')
  and has_function_privilege('service_role', 'public.set_order_status(uuid, text)', 'execute'),
  'only the service role (the admin API route) can call set_order_status'
);

select * from finish();

rollback;
