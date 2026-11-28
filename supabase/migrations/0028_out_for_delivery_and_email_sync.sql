-- 1. Delivery orders get an "Out for delivery" step between "Being prepared"
--    and "Completed". Pick-up orders never use it.
-- 2. When a customer confirms a new sign-in email, their profile row follows.
-- Apply with: npx supabase db push --remote (linked project nucodgvijjzkajllazxt).

-- ---------------------------------------------------------------------------
-- 1. out_for_delivery status
-- ---------------------------------------------------------------------------

-- The original check was declared inline, so look its name up rather than
-- guess it.
do $$
declare
  v_name text;
begin
  for v_name in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'public.orders'::regclass
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint %I', v_name);
  end loop;
end;
$$;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'processing', 'out_for_delivery', 'completed', 'cancelled'));

-- Same as 0016, plus out_for_delivery, which only a delivery order may take.
-- Errors: INVALID_STATUS, ORDER_NOT_FOUND, ORDER_CLOSED, NOT_DELIVERY.
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
  v_taken record;
  v_stock integer;
begin
  if p_status is null
     or p_status not in ('pending', 'processing', 'out_for_delivery', 'completed', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  -- Locked so two cancellations of the same order can't both restock it.
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = p_status then
    return to_jsonb(v_order);
  end if;

  if v_order.status in ('completed', 'cancelled') then
    raise exception 'ORDER_CLOSED';
  end if;

  if p_status = 'out_for_delivery' and v_order.delivery_type <> 'delivery' then
    raise exception 'NOT_DELIVERY';
  end if;

  if p_status = 'cancelled' then
    for v_taken in
      select product_id, min(product_name) as product_name, sum(quantity)::integer as quantity
        from public.inventory_logs
       where type = 'sale'
         and note = 'Order #' || p_order_id
         and product_id is not null
       group by product_id
       order by product_id
    loop
      update public.products
         set stock = stock + v_taken.quantity
       where id = v_taken.product_id
      returning stock into v_stock;

      -- The product may have been deleted since; nothing to put back then.
      if found then
        insert into public.inventory_logs (
          product_id, product_name, type, quantity, previous_stock, new_stock, note
        )
        values (
          v_taken.product_id, v_taken.product_name, 'add', v_taken.quantity,
          v_stock - v_taken.quantity, v_stock, 'Order #' || p_order_id || ' cancelled'
        );
      end if;
    end loop;
  end if;

  update public.orders
     set status = p_status
   where id = p_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

revoke all on function public.set_order_status(uuid, text) from public, anon, authenticated;
grant execute on function public.set_order_status(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Keep public.users.email in step with the sign-in email
-- ---------------------------------------------------------------------------

-- Supabase only changes auth.users.email once the customer has clicked the
-- confirmation link, so this fires exactly when the new email becomes real.
create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
     set email = new.email, updated_at = now()
   where id = new.id;
  return new;
end;
$$;

revoke all on function public.sync_user_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email and new.email is not null)
  execute function public.sync_user_email();
