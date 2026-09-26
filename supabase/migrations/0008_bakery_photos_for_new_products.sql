-- Swaps the placeholder photos 0007 first shipped with for the bakery's own
-- shots, and re-asserts the agreed prices.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

update public.products p
set image      = c.image,
    price      = c.price,
    updated_at = now()
from (
  values
    ('Regular Pandesal',     '/images/pandesal-final.jpg',            5.00),
    ('Buns',                 '/images/exposed-rolls-final.jpg',       20.00),
    ('Loaf Bread (Small)',   '/images/white-loaf-bread-final.jpg',    25.00),
    ('Loaf Bread (Large)',   '/images/white-loaf-bread-final.jpg',    50.00),
    ('Banana Bread (Slice)', '/images/sliced-banana-bread-final.jpg', 6.00),
    ('Banana Bread (Whole)', '/images/sliced-banana-bread-final.jpg', 60.00)
) as c (name, image, price)
where p.name = c.name;
