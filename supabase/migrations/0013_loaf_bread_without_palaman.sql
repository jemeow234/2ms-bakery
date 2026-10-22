-- Loaf Bread is plain bread, so it belongs under "Without Palaman".
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

update public.products
set category   = 'without_palaman',
    updated_at = now()
where name in ('Loaf Bread (Small)', 'Loaf Bread (Large)');
