-- Regular Pandesal drops from 5 to 2 pesos.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

update public.products
set price = 2.00,
    updated_at = now()
where name = 'Regular Pandesal';
