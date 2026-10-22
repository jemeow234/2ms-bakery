-- 1. Order status changes go through set_order_status(), which puts stock
--    back when an order is cancelled.
-- 2. POS walk-in sales stop being filed under the admin who rang them up.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

-- ---------------------------------------------------------------------------
-- 1. set_order_status
-- ---------------------------------------------------------------------------

-- Completed and cancelled are final, as in the admin orders page: a cancelled
-- order's stock is already back on the shelf, and a completed one has left
-- the shop. Moving to 'cancelled' returns exactly what the order took — read
-- from its 'sale' rows in inventory_logs rather than its items, because
-- orders placed before 0013 didn't always manage to take stock.
--
-- Errors: INVALID_STATUS, ORDER_NOT_FOUND, ORDER_CLOSED.
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
  if p_status is null or p_status not in ('pending', 'processing', 'completed', 'cancelled') then
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
-- 2. Walk-in sales belong to no account
-- ---------------------------------------------------------------------------

-- The POS used to save each sale under the signed-in admin's user_id, so
-- every walk-in showed up as one of that admin's own orders. A walk-in is
-- the only kind of order with no customer email (online checkout requires
-- one), which is how these rows are recognised.
update public.orders
   set user_id = null
 where user_id is not null
   and coalesce(customer_email, '') = '';
