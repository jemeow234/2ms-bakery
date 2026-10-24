-- Special (bulk) order requests, so the admin panel can list them instead of
-- the bakery only having the email. The request is still emailed too.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

create table if not exists public.special_orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (id) on delete set null,
  name        text not null,
  email       text not null,
  phone       text not null,
  product     text not null,
  quantity    integer not null check (quantity > 0),
  needed_by   date not null,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  notes       text not null default '',
  status      text not null default 'new'
              check (status in ('new', 'confirmed', 'completed', 'declined')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists special_orders_created_at_idx on public.special_orders (created_at desc);

drop trigger if exists special_orders_set_updated_at on public.special_orders;
create trigger special_orders_set_updated_at
  before update on public.special_orders
  for each row execute function public.set_updated_at();

alter table public.special_orders enable row level security;

-- A signed-in customer files requests as themselves, always starting as 'new'.
drop policy if exists "special orders insert own" on public.special_orders;
create policy "special orders insert own" on public.special_orders
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'new');

drop policy if exists "special orders read own or admin" on public.special_orders;
create policy "special orders read own or admin" on public.special_orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "special orders admin update" on public.special_orders;
create policy "special orders admin update" on public.special_orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "special orders admin delete" on public.special_orders;
create policy "special orders admin delete" on public.special_orders
  for delete to authenticated
  using (public.is_admin());
