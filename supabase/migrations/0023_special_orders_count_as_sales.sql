-- Completed special orders count as sales. Sales and reports are read from
-- public.orders, so completing a special order records a completed order for
-- it (at the final price the bakery charged), and moving it off 'completed'
-- removes that order again. Stock isn't touched: bulk orders are baked to
-- order, not taken from the shelf.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

alter table public.special_orders
  add column if not exists total    numeric(10, 2) check (total >= 0),
  add column if not exists order_id uuid references public.orders (id) on delete set null;

-- Errors: INVALID_STATUS, SPECIAL_ORDER_NOT_FOUND, TOTAL_REQUIRED.
create or replace function public.set_special_order_status(
  p_id     uuid,
  p_status text,
  p_total  numeric  -- final amount charged; null falls back to the estimate
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_special public.special_orders;
  v_total   numeric(10, 2);
  v_order   public.orders;
begin
  if p_status is null or p_status not in ('new', 'confirmed', 'completed', 'declined') then
    raise exception 'INVALID_STATUS';
  end if;

  -- Locked so two clicks on "Completed" can't record the sale twice.
  select * into v_special from public.special_orders where id = p_id for update;
  if not found then
    raise exception 'SPECIAL_ORDER_NOT_FOUND';
  end if;

  if p_status = 'completed' and v_special.order_id is null then
    v_total := round(coalesce(p_total, v_special.unit_price * v_special.quantity), 2);
    if v_total is null or v_total < 0 then
      raise exception 'TOTAL_REQUIRED';
    end if;

    insert into public.orders (
      user_id, customer_name, customer_email, customer_phone,
      delivery_type, delivery_date, payment_method, status, total
    )
    values (
      v_special.user_id, v_special.name, v_special.email, v_special.phone,
      v_special.fulfillment, v_special.needed_by, 'cash', 'completed', v_total
    )
    returning * into v_order;

    -- Linked to the menu item when there is one, so reports can group it.
    insert into public.order_items (order_id, product_id, product_name, quantity, price)
    values (
      v_order.id,
      (select id from public.products where name = v_special.product limit 1),
      v_special.product,
      v_special.quantity,
      round(v_total / v_special.quantity, 2)
    );

    update public.special_orders
       set status = 'completed', total = v_total, order_id = v_order.id
     where id = p_id
    returning * into v_special;

  elsif p_status <> 'completed' and v_special.order_id is not null then
    delete from public.orders where id = v_special.order_id;

    update public.special_orders
       set status = p_status, total = null, order_id = null
     where id = p_id
    returning * into v_special;

  else
    update public.special_orders
       set status = p_status
     where id = p_id
    returning * into v_special;
  end if;

  return to_jsonb(v_special);
end;
$$;

revoke all on function public.set_special_order_status(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.set_special_order_status(uuid, text, numeric) to service_role;

-- Special orders completed before this change, at their estimated price and
-- dated when they were completed rather than today. Ones with no menu price
-- ("Other" items) need re-completing with a total.
do $$
declare
  v_row     record;
  v_special jsonb;
begin
  for v_row in
    select id, updated_at from public.special_orders
     where status = 'completed' and order_id is null and unit_price is not null
  loop
    v_special := public.set_special_order_status(v_row.id, 'completed', null);
    update public.orders
       set created_at = v_row.updated_at
     where id = (v_special ->> 'order_id')::uuid;
  end loop;
end;
$$;
