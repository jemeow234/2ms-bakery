-- pgTAP: adjust_stock() (0017) and hit_rate_limit() (0018).
-- Run with: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into public.products (id, name, price, stock, category)
values ('dddddddd-0000-4000-8000-000000000001', 'Test Pandesal', 2.00, 10, 'without_palaman');

-- ---------------------------------------------------------------------------
-- adjust_stock
-- ---------------------------------------------------------------------------

select is(
  (public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'add', 5, 'delivery') ->> 'stock')::int,
  15,
  'add 5: 10 -> 15'
);
select is(
  (select previous_stock || '->' || new_stock || ' ' || note from public.inventory_logs
    where product_id = 'dddddddd-0000-4000-8000-000000000001' and type = 'add'),
  '10->15 delivery',
  'the change is logged with its note'
);
select is(
  (public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'remove', 20, null) ->> 'stock')::int,
  0,
  'remove stops at 0'
);
select is(
  (public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'adjustment', 7, '') ->> 'stock')::int,
  7,
  'adjustment sets the exact count'
);
select is(
  (public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'adjustment', 0, null) ->> 'stock')::int,
  0,
  'adjustment can set the count to 0'
);

select throws_ok(
  $$ select public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'add', 0, null) $$,
  'P0001', 'INVALID_QUANTITY', 'adding 0 is refused'
);
select throws_ok(
  $$ select public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'adjustment', -3, null) $$,
  'P0001', 'INVALID_QUANTITY', 'a negative count is refused'
);
select throws_ok(
  $$ select public.adjust_stock('dddddddd-0000-4000-8000-000000000001', 'sale', 1, null) $$,
  'P0001', 'INVALID_TYPE', 'sales can only be logged by create_order'
);
select throws_ok(
  $$ select public.adjust_stock('00000000-0000-4000-8000-000000000000', 'add', 1, null) $$,
  'P0001', 'PRODUCT_NOT_FOUND', 'an unknown product is refused'
);

select ok(
  not has_function_privilege('authenticated', 'public.adjust_stock(uuid, text, integer, text)', 'execute')
  and not has_function_privilege('anon', 'public.adjust_stock(uuid, text, integer, text)', 'execute')
  and has_function_privilege('service_role', 'public.adjust_stock(uuid, text, integer, text)', 'execute'),
  'only the service role (the admin API route) can call adjust_stock'
);

-- ---------------------------------------------------------------------------
-- hit_rate_limit
-- ---------------------------------------------------------------------------

select ok(
  public.hit_rate_limit('test:a', 3, 600)
  and public.hit_rate_limit('test:a', 3, 600)
  and public.hit_rate_limit('test:a', 3, 600),
  'the first 3 hits are allowed'
);
select is(public.hit_rate_limit('test:a', 3, 600), false, 'the 4th is refused');
select is(public.hit_rate_limit('test:b', 3, 600), true, 'other keys keep their own count');

update public.rate_limits set window_start = now() - interval '11 minutes' where key = 'test:a';
select is(public.hit_rate_limit('test:a', 3, 600), true, 'a new window starts after it expires');
select is((select hits from public.rate_limits where key = 'test:a'), 1, '...with the count reset');

select ok(
  not has_function_privilege('anon', 'public.hit_rate_limit(text, integer, integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.hit_rate_limit(text, integer, integer)', 'execute')
  and has_function_privilege('service_role', 'public.hit_rate_limit(text, integer, integer)', 'execute'),
  'only the service role can count hits'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.rate_limits'::regclass),
  'rate_limits has RLS on (and no policies), so the public key cannot read or reset it'
);

select * from finish();

rollback;
