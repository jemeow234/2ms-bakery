-- Bicho (2) and Bicho (3) are dropped; only the single 'Bicho' remains.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

-- order_items.product_id and inventory_logs.product_id are `on delete set null`,
-- so any past sale keeps its stored product_name, quantity and price.
delete from public.products
where name in ('Bicho (2)', 'Bicho (3)');
