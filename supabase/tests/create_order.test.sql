-- pgTAP: create_order() (0014_create_order_function.sql) prices an order from
-- the products table, takes stock in the same transaction, and refuses
-- anything it can't honour without writing a thing.
-- Run with: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into public.products (id, name, price, stock, category)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Pandesal', 2.00, 10, 'without_palaman'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Test Ensaymada', 15.00, 3, 'without_palaman');

-- ---------------------------------------------------------------------------
-- A good order
-- ---------------------------------------------------------------------------

create temp table placed as
select public.create_order(
  '[{"product_id": "aaaaaaaa-0000-4000-8000-000000000001", "quantity": 3},
    {"product_id": "aaaaaaaa-0000-4000-8000-000000000002", "quantity": 2},
    {"product_id": "aaaaaaaa-0000-4000-8000-000000000001", "quantity": 1}]',
  null, 'Test', 'test@example.com', '0917', 'Lipa', 'pickup', null,
  '2030-01-01', '09:00', 'cash', null, 'pending', 38.00
) as o;

select is((select (o ->> 'total')::numeric from placed), 38.00::numeric,
          'the total is 4 x 2.00 + 2 x 15.00, from product prices');
select is((select jsonb_array_length(o -> 'order_items') from placed), 2,
          'a product listed twice becomes one line');
select is((select quantity from public.order_items
            where order_id = (select (o ->> 'id')::uuid from placed)
              and product_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 4,
          'the merged line has both quantities');
select is((select stock from public.products where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 6,
          'pandesal stock goes 10 -> 6');
select is((select stock from public.products where id = 'aaaaaaaa-0000-4000-8000-000000000002'), 1,
          'ensaymada stock goes 3 -> 1');
select is((select count(*)::int from public.inventory_logs
            where note = 'Order #' || (select o ->> 'id' from placed)), 2,
          'one sale is logged per product');

-- ---------------------------------------------------------------------------
-- Refusals
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ select public.create_order(
       '[{"product_id": "aaaaaaaa-0000-4000-8000-000000000001", "quantity": 2}]',
       null, 'T', 'test@example.com', '0917', '', 'pickup', null, null, null,
       'cash', null, 'pending', 0.01) $$,
  'P0001', 'PRICE_CHANGED',
  'a total that does not match the prices is refused'
);

select throws_ok(
  $$ select public.create_order(
       '[{"product_id": "aaaaaaaa-0000-4000-8000-000000000001", "quantity": 1},
         {"product_id": "aaaaaaaa-0000-4000-8000-000000000002", "quantity": 2}]',
       null, 'T', 'test@example.com', '0917', '', 'pickup', null, null, null,
       'cash', null, 'pending', null) $$,
  'P0001', 'OUT_OF_STOCK',
  'ordering more than is in stock is refused'
);

select is((select stock from public.products where id = 'aaaaaaaa-0000-4000-8000-000000000001'), 6,
          'the refused order took no stock, even for the line that fit');

select throws_ok(
  $$ select public.create_order(
       '[{"product_id": "00000000-0000-4000-8000-000000000000", "quantity": 1}]',
       null, 'T', 'test@example.com', '0917', '', 'pickup', null, null, null,
       'cash', null, 'pending', null) $$,
  'P0001', 'PRODUCT_NOT_FOUND',
  'an unknown product is refused'
);

select throws_ok(
  $$ select public.create_order(
       '[{"product_id": "aaaaaaaa-0000-4000-8000-000000000001", "quantity": 0}]',
       null, 'T', 'test@example.com', '0917', '', 'pickup', null, null, null,
       'cash', null, 'pending', null) $$,
  'P0001', 'INVALID_QUANTITY',
  'a zero quantity is refused'
);

select throws_ok(
  $$ select public.create_order('[]', null, 'T', 'test@example.com', '0917', '',
       'pickup', null, null, null, 'cash', null, 'pending', null) $$,
  'P0001', 'EMPTY_ORDER',
  'an empty order is refused'
);

select throws_ok(
  $$ select public.create_order(
       '[{"product_id": "aaaaaaaa-0000-4000-8000-000000000001", "quantity": 1}]',
       null, 'T', 'test@example.com', '0917', '', 'pickup', null, null, null,
       'cash', null, 'processing', null) $$,
  'P0001', 'INVALID_STATUS',
  'only pending and completed orders can be created'
);

-- ---------------------------------------------------------------------------
-- Who may call it
-- ---------------------------------------------------------------------------

select ok(
  not has_function_privilege('anon',
    'public.create_order(jsonb, uuid, text, text, text, text, text, numeric, date, text, text, text, text, numeric)',
    'execute'),
  'anon cannot call create_order'
);

select ok(
  not has_function_privilege('authenticated',
    'public.create_order(jsonb, uuid, text, text, text, text, text, numeric, date, text, text, text, text, numeric)',
    'execute'),
  'signed-in users cannot call create_order directly'
);

select ok(
  has_function_privilege('service_role',
    'public.create_order(jsonb, uuid, text, text, text, text, text, numeric, date, text, text, text, text, numeric)',
    'execute'),
  'the service role (the API route) can call create_order'
);

select * from finish();

rollback;
