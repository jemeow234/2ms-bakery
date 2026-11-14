-- Email code on every new sign-in.
--
-- A password sign-in creates a Supabase Auth session, but that session is not
-- trusted until the code emailed to the account owner has been entered. Each
-- session (the JWT's session_id) is verified once; refreshing tokens keeps the
-- same session, while signing in again starts a new one and needs a new code.
--
-- Enforced here, not just in the UI: the policies below hide every user's
-- data from an unverified session, and is_admin() is false for one.

create table if not exists public.login_verifications (
  -- The JWT's session_id. Session ids are never reused, so a row left behind
  -- after sign-out can't verify anything else.
  session_id  uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  sent_at     timestamptz not null default now(),
  verified_at timestamptz
);

-- No policies: only the service role (the API routes) and the security
-- definer functions below can touch it.
alter table public.login_verifications enable row level security;

-- True when the caller's current session has had its email code entered.
create or replace function public.session_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.login_verifications
    where session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
      and user_id = auth.uid()
      and verified_at is not null
  );
$$;

revoke all on function public.session_verified() from public, anon;
grant execute on function public.session_verified() to authenticated, service_role;

-- Checks one guess at a session's code. The row lock taken by the update
-- serialises concurrent guesses, so the attempt limit can't be raced.
create or replace function public.check_login_code(
  p_session_id uuid,
  p_user_id    uuid,
  p_code_hash  text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.login_verifications;
begin
  update public.login_verifications
     set attempts = attempts + 1
   where session_id = p_session_id
     and user_id = p_user_id
   returning * into v;

  if not found then
    return 'NO_CODE';
  end if;
  if v.verified_at is not null then
    return 'OK';
  end if;
  if v.expires_at < now() then
    return 'EXPIRED';
  end if;
  if v.attempts > 5 then
    return 'TOO_MANY_ATTEMPTS';
  end if;
  if v.code_hash <> p_code_hash then
    return 'WRONG_CODE';
  end if;

  update public.login_verifications
     set verified_at = now(), code_hash = ''
   where session_id = p_session_id;
  return 'OK';
end;
$$;

revoke all on function public.check_login_code(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.check_login_code(uuid, uuid, text) to service_role;

-- Admin rights need a verified session too. This covers every admin policy,
-- including product, announcement and storage writes.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ) and public.session_verified();
$$;

-- Restrictive policies are ANDed with the existing permissive ones, so a
-- signed-in but unverified session sees none of anyone's personal data.
-- (Products and announcements stay publicly readable.)
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'orders', 'order_items', 'order_feedback', 'special_orders', 'inventory_logs'
  ] loop
    execute format('drop policy if exists "require verified session" on public.%I', t);
    execute format(
      'create policy "require verified session" on public.%I as restrictive
         for all to authenticated
         using (public.session_verified())
         with check (public.session_verified())',
      t
    );
  end loop;
end;
$$;
