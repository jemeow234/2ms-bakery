-- Nine Filipino bakery items added to the catalog.
-- Applied with the Supabase CLI: npx supabase db push (linked project
-- nucodgvijjzkajllazxt). Applied 2026-09-20.

-- products.name has no unique constraint, so the insert is made re-runnable with
-- an anti-join rather than on conflict. ingredients is a text column, stored
-- comma-joined the same way the seed route writes it.
with new_products (name, description, price, category, image, featured, stock, ingredients) as (
  values
    ('Pandesal (6 pcs)',
     'The Filipino breakfast staple. Soft, slightly sweet rolls rolled in breadcrumbs and baked fresh every morning.',
     40.00, 'bread', '/images/whole-wheat.jpg', true, 60,
     'Flour, Water, Yeast, Sugar, Salt, Breadcrumbs'),
    ('Ube Cheese Pandesal (4 pcs)',
     'Purple yam pandesal with a molten cheese center that stretches with every bite.',
     75.00, 'bread', '/images/sourdough.jpg', true, 35,
     'Flour, Ube halaya, Quick melt cheese, Butter, Milk, Yeast'),
    ('Spanish Bread (6 pcs)',
     'Rolled soft bread with a buttery sugar filling, baked until golden and lightly crisp at the edges.',
     60.00, 'pastry', '/images/cinnamon-roll.jpg', false, 40,
     'Flour, Butter, Sugar, Milk, Breadcrumbs, Eggs'),
    ('Ensaymada',
     'Brioche-soft coil brushed with butter, topped with sugar and a generous blanket of grated cheese.',
     55.00, 'pastry', '/images/almond-croissant.jpg', true, 30,
     'Flour, Butter, Egg yolks, Sugar, Edam cheese, Milk'),
    ('Pan de Coco (4 pcs)',
     'Pillowy buns stuffed with sweet shredded coconut simmered in muscovado.',
     50.00, 'pastry', '/images/apple-danish.jpg', false, 35,
     'Flour, Coconut, Muscovado sugar, Butter, Milk, Yeast'),
    ('Ube Cake Slice',
     'Moist purple yam chiffon layered with ube buttercream and a dusting of toasted coconut.',
     120.00, 'cake', '/images/carrot-cake.jpg', false, 15,
     'Ube halaya, Flour, Eggs, Coconut milk, Butter, Sugar'),
    ('Mamon (6 pcs)',
     'Cloud-light sponge cakes baked in fluted cups and brushed with butter and sugar.',
     90.00, 'cake', '/images/chocolate-cake.jpg', false, 20,
     'Flour, Eggs, Sugar, Butter, Milk, Cream of tartar'),
    ('Polvoron (10 pcs)',
     'Toasted milk shortbread that melts on the tongue, hand-pressed and wrapped in cellophane.',
     85.00, 'cookie', '/images/oatmeal-cookie.jpg', false, 45,
     'Toasted flour, Powdered milk, Butter, Sugar'),
    ('Otap (8 pcs)',
     'Crisp oval puff pastry from Cebu, sugar-dusted and shatteringly flaky.',
     70.00, 'cookie', '/images/chocolate-chip-cookie.jpg', false, 40,
     'Flour, Coconut, Shortening, Sugar, Eggs')
)
insert into public.products (name, description, price, category, image, featured, stock, ingredients)
select n.name, n.description, n.price, n.category, n.image, n.featured, n.stock, n.ingredients
from new_products n
where not exists (select 1 from public.products p where p.name = n.name);
