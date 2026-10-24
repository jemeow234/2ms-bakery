-- Buns now come in two sizes, like Loaf Bread and Banana Bread. The existing
-- row becomes "Buns (Small)" so its id, stock and past orders carry over, and
-- "Buns (Large)" is added from it at double the price.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

update public.products
set name       = 'Buns (Small)',
    updated_at = now()
where name = 'Buns';

-- products.name has no unique constraint, so skip if it's already present.
insert into public.products (name, description, price, category, image, featured, stock, ingredients)
select 'Buns (Large)',
       'Bigger golden, pillowy soft buns baked together in a tray — enough to share or for hearty sandwiches.',
       s.price * 2, s.category, s.image, s.featured, s.stock, s.ingredients
from public.products s
where s.name = 'Buns (Small)'
  and not exists (select 1 from public.products p where p.name = 'Buns (Large)')
limit 1;
