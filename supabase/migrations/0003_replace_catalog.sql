-- Replaces the catalog with the 18 items the bakery actually sells, each
-- pointing at its own photo in /public/images. Apply with: npx supabase db push
-- (linked project nucodgvijjzkajllazxt).

-- Everything not on this list goes away. order_items.product_id and
-- inventory_logs.product_id are `on delete set null`, so past orders and logs
-- survive the delete with their stored name/price intact.

-- products.name still has no unique constraint, so this is written as an
-- update-then-insert against the names rather than an upsert. ingredients is a
-- text column, stored comma-joined the way the migrate route writes it.
with catalog (name, description, price, category, image, featured, stock, ingredients) as (
  values
    ('Butterfly',
     'Sugar-glazed bread folded into wings, soft in the middle with lightly crisp edges.',
     5.00, 'pastry', '/images/butterfly.jpg', true, 40,
     'Flour, Butter, Sugar, Yeast, Milk, Eggs'),
    ('Coco German',
     'Crisp German-style roll with a sweet toasted coconut filling.',
     5.00, 'pastry', '/images/coco_german.jpg', false, 40,
     'Flour, Coconut, Sugar, Butter, Yeast'),
    ('Coco Roll',
     'Soft bread rolled around sweetened shredded coconut and baked golden.',
     5.00, 'pastry', '/images/coco_roll.jpg', false, 40,
     'Flour, Coconut, Sugar, Butter, Milk, Yeast'),
    ('Star Bread (Putok)',
     'The classic putok — dense, faintly salty bread that cracks open into a star as it bakes.',
     5.00, 'bread', '/images/star_bread__putok.jpg', true, 50,
     'Flour, Water, Sugar, Salt, Yeast'),
    ('Ube Pandesal',
     'Purple yam pandesal rolled in breadcrumbs, soft and lightly sweet straight from the oven.',
     5.00, 'bread', '/images/ube_pandesal.jpg', true, 60,
     'Flour, Ube halaya, Sugar, Milk, Butter, Yeast, Breadcrumbs'),
    ('Bicho',
     'Twisted fried dough rolled in sugar, crisp outside and chewy within.',
     6.00, 'pastry', '/images/bicho.jpg', false, 35,
     'Flour, Sugar, Yeast, Eggs, Cooking oil'),
    ('Bicho (2)',
     'Ring-cut bicho with a generous sugar coating on every side.',
     6.00, 'pastry', '/images/bicho_2.jpg', false, 35,
     'Flour, Sugar, Yeast, Eggs, Cooking oil'),
    ('Bicho (3)',
     'Braided bicho fried to a deep gold and finished with fine sugar.',
     6.00, 'pastry', '/images/bicho_3.jpg', false, 35,
     'Flour, Sugar, Yeast, Eggs, Cooking oil'),
    ('Custard Bread',
     'Pillowy bun filled with smooth vanilla custard.',
     5.00, 'bread', '/images/custard_bread.jpg', true, 40,
     'Flour, Eggs, Milk, Sugar, Butter, Vanilla'),
    ('Ensaymada',
     'Brioche-soft coil brushed with butter, topped with sugar and grated cheese.',
     5.00, 'pastry', '/images/ensaymada.jpg', true, 40,
     'Flour, Butter, Egg yolks, Sugar, Cheese, Milk'),
    ('Kababayan',
     'Little gold muffin-shaped sponge with a chewy crust. 2 pieces for 5 pesos.',
     2.50, 'cake', '/images/kababayan.jpg', false, 80,
     'Flour, Eggs, Sugar, Milk, Baking powder'),
    ('Lambingan',
     'Soft twin rolls baked side by side, buttery and lightly sweet.',
     5.00, 'pastry', '/images/lambingan.jpg', false, 40,
     'Flour, Butter, Sugar, Milk, Yeast'),
    ('Pan de Coco',
     'Pillowy bun stuffed with sweet shredded coconut simmered in muscovado.',
     5.00, 'bread', '/images/pan_de_coco.jpg', true, 45,
     'Flour, Coconut, Muscovado sugar, Butter, Milk, Yeast'),
    ('Pinagong',
     'Marinduque-style turtle-shaped bread, firm crust with a soft, faintly sweet crumb.',
     5.00, 'bread', '/images/pinagong.jpg', false, 45,
     'Flour, Water, Sugar, Salt, Yeast, Breadcrumbs'),
    ('Pineapple Pie',
     'Flaky hand pie packed with sweet-tart pineapple filling.',
     5.00, 'pastry', '/images/pineapple_pie.jpg', false, 35,
     'Flour, Butter, Pineapple, Sugar, Eggs'),
    ('Spanish Bread',
     'Rolled soft bread with a buttery sugar filling, baked golden and lightly crisp at the edges.',
     5.00, 'bread', '/images/spanish_bread.jpg', true, 50,
     'Flour, Butter, Sugar, Milk, Breadcrumbs, Eggs'),
    ('Ube Pie',
     'Flaky hand pie with a rich purple yam filling.',
     5.00, 'pastry', '/images/ube_pie.jpg', false, 35,
     'Flour, Butter, Ube halaya, Sugar, Eggs'),
    ('Ube Tsinelas',
     'Slipper-shaped soft bread swirled with ube and brushed with butter.',
     5.00, 'pastry', '/images/ube_tsinelas.jpg', false, 35,
     'Flour, Ube halaya, Butter, Sugar, Milk, Yeast')
),
retired as (
  delete from public.products p
  where not exists (select 1 from catalog c where c.name = p.name)
  returning p.id
),
refreshed as (
  update public.products p
  set description = c.description,
      price       = c.price,
      category    = c.category,
      image       = c.image,
      featured    = c.featured,
      ingredients = c.ingredients,
      updated_at  = now()
  from catalog c
  where c.name = p.name
  returning p.name
)
insert into public.products (name, description, price, category, image, featured, stock, ingredients)
select c.name, c.description, c.price, c.category, c.image, c.featured, c.stock, c.ingredients
from catalog c
where not exists (select 1 from refreshed r where r.name = c.name);
