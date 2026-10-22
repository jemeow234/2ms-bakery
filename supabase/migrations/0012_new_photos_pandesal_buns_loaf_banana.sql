-- Replaces the Regular Pandesal, Buns, Loaf Bread and Banana Bread photos with
-- the bakery's new shots.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

update public.products
set image = case name
      when 'Regular Pandesal'     then '/images/regular-pandesal.jpg'
      when 'Buns'                 then '/images/buns.jpg'
      when 'Loaf Bread (Small)'   then '/images/loaf-bread.jpg'
      when 'Loaf Bread (Large)'   then '/images/loaf-bread.jpg'
      when 'Banana Bread (Slice)' then '/images/banana-bread.jpg'
      when 'Banana Bread (Whole)' then '/images/banana-bread.jpg'
    end,
    updated_at = now()
where name in (
  'Regular Pandesal',
  'Buns',
  'Loaf Bread (Small)',
  'Loaf Bread (Large)',
  'Banana Bread (Slice)',
  'Banana Bread (Whole)'
);
