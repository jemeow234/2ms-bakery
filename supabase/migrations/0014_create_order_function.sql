-- Orders are created in one transaction by create_order(): prices come from
-- the products table (never from the browser), stock is checked and taken
-- under a row lock, and the order, its items, the stock change and the
-- inventory log either all land or none do.
--
-- Only the service role may call it. The /api/orders route checks who is
-- asking (walk-in sales need an admin), the schedule, the delivery distance
-- and the payment screenshot first; this function owns money and stock.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

-- Rows written by the old read-then-write decrement may already be negative,
-- so only new writes are held to this.
alter table public.products drop constraint if exists products_stock_nonnegative;
alter table public.products
  add constraint products_stock_nonnegative check (stock >= 0) not valid;

-- Errors are raised with a fixed message (EMPTY_ORDER, INVALID_QUANTITY,
-- PRODUCT_NOT_FOUND, OUT_OF_STOCK, PRICE_CHANGED, INVALID_STATUS) that the
-- route translates for the customer.
create or replace function public.create_order(
  p_items            jsonb,   -- [{ "product_id": uuid, "quantity": int }]
  p_user_id          uuid,
  p_customer_name    text,
  p_customer_email   text,
  p_customer_phone   text,
  p_address          text,
  p_delivery_type    text,
  p_distance         numeric,
  p_delivery_date    date,
  p_delivery_session text,
  p_payment_method   text,
  p_payment_proof    text,
  p_status           text,
  p_expected_total   numeric  -- what the customer was shown; null skips the check
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order   public.orders;
  v_line    record;
  v_product record;
  v_total   numeric(10, 2) := 0;
  v_items   jsonb := '[]'::jsonb;
begin
  if p_status is null or p_status not in ('pending', 'completed') then
    raise exception 'INVALID_STATUS';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone, address,
    delivery_type, distance, delivery_date, delivery_session,
    payment_method, payment_proof, status, total
  )
  values (
    p_user_id, p_customer_name, p_customer_email, p_customer_phone, p_address,
    p_delivery_type, p_distance, p_delivery_date, p_delivery_session,
    p_payment_method, p_payment_proof, p_status, 0
  )
  returning * into v_order;

  -- A product listed twice is one line. Rows are locked in id order so two
  -- orders for the same products queue up instead of deadlocking.
  for v_line in
    select (line ->> 'product_id')::uuid as product_id,
           sum((line ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as line
    group by 1
    order by 1
  loop
    if v_line.product_id is null or v_line.quantity is null or v_line.quantity < 1 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select id, name, price, stock
      into v_product
      from public.products
     where id = v_line.product_id
       for update;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    if v_product.stock < v_line.quantity then
      raise exception 'OUT_OF_STOCK' using detail = v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, product_name, quantity, price)
    values (v_order.id, v_product.id, v_product.name, v_line.quantity, v_product.price);

    update public.products
       set stock = v_product.stock - v_line.quantity
     where id = v_product.id;

    insert into public.inventory_logs (
      product_id, product_name, type, quantity, previous_stock, new_stock, note
    )
    values (
      v_product.id, v_product.name, 'sale', v_line.quantity,
      v_product.stock, v_product.stock - v_line.quantity, 'Order #' || v_order.id
    );

    v_total := v_total + v_product.price * v_line.quantity;
    v_items := v_items || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_line.quantity,
      'price', v_product.price
    );
  end loop;

  -- The customer saw this total in their cart, and a GCash customer has
  -- already paid it. If prices moved since, refuse rather than record a
  -- different amount.
  if p_expected_total is not null and round(p_expected_total, 2) <> v_total then
    raise exception 'PRICE_CHANGED';
  end if;

  update public.orders
     set total = v_total
   where id = v_order.id
  returning * into v_order;

  return to_jsonb(v_order) || jsonb_build_object('order_items', v_items);
end;
$$;

-- Supabase grants execute on new public functions to anon and authenticated
-- by default; this one must only be reachable through the API route.
revoke all on function public.create_order(
  jsonb, uuid, text, text, text, text, text, numeric, date, text, text, text, text, numeric
) from public, anon, authenticated;

grant execute on function public.create_order(
  jsonb, uuid, text, text, text, text, text, numeric, date, text, text, text, text, numeric
) to service_role;
