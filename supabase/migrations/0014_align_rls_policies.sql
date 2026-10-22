-- Make the live row-level security match 0000_initial_schema.sql exactly.
--
-- The database was first set up by hand, and 0000 only drops and recreates
-- policies under its own names, so a policy made back then under any other
-- name is still active. The checkout route used to depend on one: it inserted
-- orders with the customer's own session, which no 0000 policy allows. Any
-- such policy also lets anyone holding the public key write orders (or
-- products) straight through the Data API, around every server-side check.
--
-- Since 0013 a customer's order is written by create_order() under the
-- service role, so 0000's policies are the complete set the app needs. This
-- drops every other policy on the app's tables, printing each as a NOTICE.
-- It first checks that all of 0000's policies exist and stops if any is
-- missing, so it can never leave a table with no access at all.
--
-- Deploy the code that calls create_order() together with this migration:
-- the old checkout route stops working once the extra policies are gone.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

alter table public.users          enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.announcements  enable row level security;
alter table public.order_feedback enable row level security;

do $$
declare
  expected text[] := array[
    'users:users read own or admin',
    'users:users insert own',
    'users:users update own or admin',
    'users:users delete admin',
    'products:products read all',
    'products:products admin write',
    'orders:orders read own or admin',
    'orders:orders admin update',
    'orders:orders admin delete',
    'order_items:order items read via order',
    'inventory_logs:inventory logs admin',
    'announcements:announcements read all',
    'announcements:announcements admin write',
    'order_feedback:feedback read own or admin',
    'order_feedback:feedback insert own order'
  ];
  missing text;
  extra   record;
begin
  select string_agg(e, ', ')
    into missing
    from unnest(expected) as e
   where not exists (
     select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename || ':' || p.policyname = e
   );

  if missing is not null then
    raise exception 'Expected policies are missing (%). Re-run 0000_initial_schema.sql first.', missing;
  end if;

  for extra in
    select p.tablename, p.policyname, p.cmd, p.roles
      from pg_policies p
     where p.schemaname = 'public'
       and p.tablename in ('users', 'products', 'orders', 'order_items',
                           'inventory_logs', 'announcements', 'order_feedback')
       and not (p.tablename || ':' || p.policyname = any (expected))
  loop
    raise notice 'Dropping policy "%" on public.% (% for %)',
      extra.policyname, extra.tablename, extra.cmd, extra.roles;
    execute format('drop policy %I on public.%I', extra.policyname, extra.tablename);
  end loop;
end
$$;
