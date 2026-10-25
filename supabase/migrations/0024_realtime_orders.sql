-- New-order alerts in the admin panel listen for inserts on public.orders
-- through Supabase Realtime. Realtime applies the table's RLS, so only admins
-- (who may read every order) hear about other customers' orders.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
