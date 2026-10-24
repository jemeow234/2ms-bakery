-- The menu price per piece when a special (bulk) order was requested, so the
-- admin panel can show an estimated total. Null for "Other" items that aren't
-- on the menu. The bakery still confirms the final price with the customer.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

alter table public.special_orders
  add column if not exists unit_price numeric(10, 2) check (unit_price >= 0);
