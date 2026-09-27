-- 1. Products are now grouped by whether they have palaman (filling) instead of
--    bread/pastry/cake. Plain: pandesal, ube pandesal, putok, ensaymada,
--    lambingan. Everything else is "with palaman".
-- 2. GCash/InstaPay orders carry a screenshot of the customer's QR payment.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

alter table public.products drop constraint if exists products_category_check;

update public.products
set category = case
      when name in ('Regular Pandesal', 'Ube Pandesal', 'Star Bread (Putok)', 'Ensaymada', 'Lambingan')
        then 'without_palaman'
      else 'with_palaman'
    end,
    updated_at = now();

alter table public.products alter column category set default 'with_palaman';
alter table public.products
  add constraint products_category_check
  check (category in ('without_palaman', 'with_palaman'));

-- Path inside the private payment-proofs bucket, not a URL. Admin reads get a
-- short-lived signed URL.
alter table public.orders add column if not exists payment_proof text;

-- Private: screenshots show the customer's name and account. Uploads and reads
-- both go through the service-role key in API routes, so no storage policies
-- are granted here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
