-- Adds Regular Pandesal, Buns, Loaf Bread and Banana Bread. Loaf and banana
-- bread come in two sizes each, listed as separate products.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

-- products.name has no unique constraint, so skip any name already present.
with catalog (name, description, price, category, image, featured, stock, ingredients) as (
  values
    ('Regular Pandesal',
     'The everyday Filipino breakfast roll — soft, lightly sweet, and rolled in fine breadcrumbs.',
     5.00, 'bread', '/images/pandesal-final.jpg', true, 80,
     'Flour, Sugar, Salt, Yeast, Butter, Breadcrumbs'),
    ('Buns',
     'Golden, pillowy soft buns baked together in a tray — great on their own or for sandwiches.',
     20.00, 'bread', '/images/exposed-rolls-final.jpg', false, 30,
     'Flour, Milk, Butter, Sugar, Eggs, Yeast'),
    ('Loaf Bread (Small)',
     'Soft white sandwich loaf, sliced and ready for breakfast or merienda.',
     25.00, 'bread', '/images/white-loaf-bread-final.jpg', false, 20,
     'Flour, Milk, Sugar, Butter, Salt, Yeast'),
    ('Loaf Bread (Large)',
     'Our big soft white sandwich loaf, sliced — enough for the whole family.',
     50.00, 'bread', '/images/white-loaf-bread-final.jpg', false, 20,
     'Flour, Milk, Sugar, Butter, Salt, Yeast'),
    ('Banana Bread (Slice)',
     'A thick, moist slice of banana bread made with ripe bananas.',
     6.00, 'cake', '/images/sliced-banana-bread-final.jpg', false, 40,
     'Flour, Ripe bananas, Sugar, Eggs, Butter, Baking soda'),
    ('Banana Bread (Whole)',
     'A whole loaf of moist banana bread, perfect for sharing.',
     60.00, 'cake', '/images/sliced-banana-bread-final.jpg', true, 10,
     'Flour, Ripe bananas, Sugar, Eggs, Butter, Baking soda')
)
insert into public.products (name, description, price, category, image, featured, stock, ingredients)
select c.name, c.description, c.price, c.category, c.image, c.featured, c.stock, c.ingredients
from catalog c
where not exists (select 1 from public.products p where p.name = c.name);
