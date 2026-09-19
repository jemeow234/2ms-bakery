-- Base schema: the seven app tables, their row-level security, and the
-- product-images Storage bucket. Run this in the Supabase SQL editor BEFORE
-- 0001_delivery_sessions_and_receipts.sql. Safe to re-run.
--
-- Rebuilt from the original table list plus what the code reads and writes.
-- Differences from the original:
--   * users has no password column — Supabase Auth stores passwords in
--     auth.users, and users.id is that auth user's id.
--   * Guest checkout writes orders, order items and stock with the service-role
--     key (lib/supabase/admin.ts), so no anon write access is granted here.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  name       text not null default '',
  phone      text,
  address    text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       numeric(10, 2) not null default 0 check (price >= 0),
  category    text not null default 'other'
              check (category in ('bread', 'pastry', 'cake', 'cookie', 'other')),
  image       text not null default '',
  featured    boolean not null default false,
  stock       integer not null default 0,
  ingredients text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  -- null for guest checkouts and POS walk-ins
  user_id        uuid references public.users (id) on delete set null,
  customer_name  text,
  customer_email text,
  customer_phone text,
  address        text,
  delivery_type  text not null check (delivery_type in ('delivery', 'pickup')),
  distance       numeric(8, 2), -- km from the bakery
  total          numeric(10, 2) not null default 0,
  status         text not null default 'pending'
                 check (status in ('pending', 'processing', 'completed', 'cancelled')),
  payment_method text not null check (payment_method in ('cash', 'card')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  -- kept nullable so deleting a product doesn't erase order history
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity     integer not null check (quantity > 0),
  price        numeric(10, 2) not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.inventory_logs (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid references public.products (id) on delete set null,
  product_name   text not null,
  type           text not null check (type in ('add', 'remove', 'sale', 'adjustment')),
  quantity       integer not null,
  previous_stock integer not null,
  new_stock      integer not null,
  note           text,
  created_at     timestamptz not null default now()
);

create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  type       text not null default 'announcement'
             check (type in ('announcement', 'advertisement')),
  image      text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_feedback (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx         on public.orders (user_id);
create index if not exists orders_created_at_idx      on public.orders (created_at desc);
create index if not exists order_items_order_id_idx   on public.order_items (order_id);
create index if not exists inventory_logs_created_idx on public.inventory_logs (created_at desc);
create index if not exists order_feedback_user_id_idx on public.order_feedback (user_id);

-- ---------------------------------------------------------------------------
-- Helpers and triggers
-- ---------------------------------------------------------------------------

-- security definer so policies can check the caller's role without recursing
-- into the users table's own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Users may edit their own profile, but only an admin may change a role.
-- auth.uid() is null in the SQL editor, which is how the first admin is made.
create or replace function public.guard_user_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists users_guard_role on public.users;
create trigger users_guard_role before update on public.users
  for each row execute function public.guard_user_role();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.users          enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.announcements  enable row level security;
alter table public.order_feedback enable row level security;

-- users: a profile row is created by its owner on first sign-in, always as 'user'.
drop policy if exists "users read own or admin" on public.users;
create policy "users read own or admin" on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "users insert own" on public.users;
create policy "users insert own" on public.users
  for insert to authenticated
  with check (id = auth.uid() and role = 'user');

drop policy if exists "users update own or admin" on public.users;
create policy "users update own or admin" on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "users delete admin" on public.users;
create policy "users delete admin" on public.users
  for delete to authenticated
  using (public.is_admin());

-- products: public catalog, admin-managed.
drop policy if exists "products read all" on public.products;
create policy "products read all" on public.products
  for select to anon, authenticated
  using (true);

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- orders: customers see their own; admins see and update all.
-- Inserts come from the checkout route via the service-role key.
drop policy if exists "orders read own or admin" on public.orders;
create policy "orders read own or admin" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete" on public.orders
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "order items read via order" on public.order_items;
create policy "order items read via order" on public.order_items
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- inventory_logs: admin only (checkout's sale logs use the service-role key).
drop policy if exists "inventory logs admin" on public.inventory_logs;
create policy "inventory logs admin" on public.inventory_logs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- announcements: everyone reads, admins post and delete.
drop policy if exists "announcements read all" on public.announcements;
create policy "announcements read all" on public.announcements
  for select to anon, authenticated
  using (true);

drop policy if exists "announcements admin write" on public.announcements;
create policy "announcements admin write" on public.announcements
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_feedback: a customer rates their own orders; admins read everything.
drop policy if exists "feedback read own or admin" on public.order_feedback;
create policy "feedback read own or admin" on public.order_feedback
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "feedback insert own order" on public.order_feedback;
create policy "feedback insert own order" on public.order_feedback
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: product and announcement images
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product images admin upload" on storage.objects;
create policy "product images admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
