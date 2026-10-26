-- Product descriptions now list each item's ingredients, as provided by the
-- bakery, so customers know what's in what they order. The ingredients column
-- is updated to match. Sized items (Banana Bread, Buns, Loaf Bread) share one
-- list across their sizes.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).
with catalog (pattern, ingredients) as (
  values
    ('Pinagong',           'Bread flour, all-purpose flour, sugar, yeast, milk, eggs, margarine, salt'),
    ('Pineapple Pie',      'All-purpose flour, margarine, sugar, eggs, milk, salt, pineapple filling, cornstarch'),
    ('Regular Pandesal',   'Bread flour, all-purpose flour, sugar, yeast, milk, eggs, margarine, salt'),
    ('Spanish Bread',      'Bread flour, sugar, yeast, milk, eggs, margarine, salt, brown sugar and breadcrumbs filling'),
    ('Star Bread (Putok)', 'Bread flour, sugar, yeast, milk, eggs, margarine, salt'),
    ('Ube Pandesal',       'Bread flour, sugar, yeast, milk, eggs, margarine, salt, ube filling'),
    ('Ube Pie',            'All-purpose flour, margarine, sugar, eggs, milk, salt, ube filling, cornstarch'),
    ('Ube Tsinelas',       'Bread flour, sugar, yeast, milk, eggs, margarine, salt, ube filling, breadcrumbs'),
    ('Banana Bread (%)',   'All-purpose flour, ripe bananas, sugar, eggs, margarine, milk, baking soda, baking powder, salt, vanilla'),
    ('Bicho',              'All-purpose flour, sugar, yeast, eggs, milk, margarine, salt, sugar coating, cheese'),
    ('Buns (%)',           'Bread flour, sugar, yeast, milk, eggs, margarine, salt'),
    ('Butterfly',          'Bread flour, sugar, yeast, milk, eggs, margarine, salt, sugar and breadcrumbs filling'),
    ('Coco German',        'Bread flour, sugar, yeast, milk, eggs, margarine, salt, sweetened coconut coating, brown sugar, breadcrumbs'),
    ('Coco Roll',          'Bread flour, sugar, yeast, milk, eggs, margarine, salt, sweetened shredded coconut filling, sugar'),
    ('Custard Bread',      'Bread flour, sugar, yeast, milk, eggs, margarine, salt, vanilla custard filling'),
    ('Ensaymada',          'Bread flour, sugar, yeast, eggs, milk, margarine, salt, margarine glaze, sugar'),
    ('Kababayan',          'All-purpose flour, sugar, eggs, milk, oil, baking powder, baking soda, salt, vanilla'),
    ('Lambingan',          'Bread flour, sugar, yeast, milk, eggs, margarine, salt, food coloring'),
    ('Loaf Bread (%)',     'Bread flour, sugar, yeast, milk, eggs, margarine, salt'),
    ('Pan de Coco',        'Bread flour, sugar, yeast, milk, eggs, margarine, salt, sweetened coconut filling, brown sugar')
)
update public.products p
set description = 'Ingredients: ' || c.ingredients || '.',
    ingredients = c.ingredients,
    updated_at  = now()
from catalog c
where p.name like c.pattern;
