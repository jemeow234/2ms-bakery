-- Admin stock changes (Inventory -> Update Stock) go through adjust_stock(),
-- which locks the product row, so a sale landing at the same moment can't
-- be overwritten by a stock count read a moment earlier. The change and its
-- inventory log are written together.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).
--
-- p_type: 'add' and 'remove' move stock by p_quantity (remove stops at 0);
-- 'adjustment' sets stock to exactly p_quantity.
-- Errors: INVALID_TYPE, INVALID_QUANTITY, PRODUCT_NOT_FOUND.
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_type       text,
  p_quantity   integer,
  p_note       text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_product  public.products;
  v_previous integer;
  v_new      integer;
begin
  if p_type is null or p_type not in ('add', 'remove', 'adjustment') then
    raise exception 'INVALID_TYPE';
  end if;

  if p_quantity is null or p_quantity < 0 or (p_type <> 'adjustment' and p_quantity = 0) then
    raise exception 'INVALID_QUANTITY';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  v_previous := v_product.stock;
  v_new := case p_type
    when 'add'    then v_previous + p_quantity
    when 'remove' then greatest(0, v_previous - p_quantity)
    else p_quantity
  end;

  update public.products
     set stock = v_new
   where id = p_product_id
  returning * into v_product;

  insert into public.inventory_logs (
    product_id, product_name, type, quantity, previous_stock, new_stock, note
  )
  values (
    p_product_id, v_product.name, p_type, p_quantity, v_previous, v_new, nullif(trim(p_note), '')
  );

  return to_jsonb(v_product);
end;
$$;

revoke all on function public.adjust_stock(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.adjust_stock(uuid, text, integer, text) to service_role;
