-- The Butterfly and Coco German photos were attached to each other's product.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

update public.products
set image = case name
      when 'Butterfly'   then '/images/coco_german.jpg'
      when 'Coco German' then '/images/butterfly.jpg'
    end,
    updated_at = now()
where name in ('Butterfly', 'Coco German');
