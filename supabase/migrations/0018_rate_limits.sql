-- Request counters for the public endpoints (address check, contact form,
-- checkout) and for calls to OpenStreetMap's geocoder. Vercel runs many
-- short-lived server instances, so a counter kept in memory would only see a
-- fraction of the traffic; this one is shared.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         integer not null
);

-- No policies: only the service role (the API routes) touches this table.
alter table public.rate_limits enable row level security;

-- Counts one hit for p_key in a fixed window of p_window_seconds and returns
-- whether the caller is still within p_limit.
create or replace function public.hit_rate_limit(
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_start = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start
        end,
        hits = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1
        end
  returning hits into v_hits;

  -- Keys for visitors who never come back would pile up; sweep now and then.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
